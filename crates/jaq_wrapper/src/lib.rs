use hdi::prelude::*;
use jaq_interpret::{Ctx, Filter, FilterT, ParseCtx, RcIter};
use std::io::{self, BufRead};

// Re-export Val
pub use jaq_interpret::Val;

pub enum JqProgramInput {
    Single(String),
    Slurp(Vec<String>),
}

pub fn compile_and_run_jq(program_str: &str, input: JqProgramInput) -> ExternResult<String> {
    let filter = compile_filter(program_str)?;
    let input = input.parse()?;
    let output = run_filter(filter, input)?;
    Ok(output.to_string())
}

impl JqProgramInput {
    fn parse(self) -> ExternResult<Val> {
        match self {
            Self::Single(json) => parse_single_json(&json),
            Self::Slurp(jsons) => {
                let items = jsons
                    .into_iter()
                    .map(|json| parse_single_json(&json))
                    .collect::<ExternResult<Vec<_>>>()?;
                Ok(Val::arr(items))
            }
        }
    }
}

pub fn compile_filter(program_str: &str) -> ExternResult<Filter> {
    let (maybe_main, errs) = jaq_parse::parse(program_str, jaq_parse::main());

    if !errs.is_empty() {
        return Err(wasm_error!(format!(
            "jq program compilation failed with {} error(s)",
            errs.len()
        )));
    }
    let Some(main) = maybe_main else {
        return Err(wasm_error!(String::from("no main filter")));
    };
    let mut defs = ParseCtx::new(vec![]);
    defs.insert_natives(jaq_core::core());
    defs.insert_defs(jaq_std::std());
    let filter = defs.compile(main);
    if !defs.errs.is_empty() {
        return Err(wasm_error!(format!(
            "jq program compilation failed with {} def error(s)",
            defs.errs.len()
        )));
    }
    Ok(filter)
}

pub fn run_filter(filter: Filter, input: Val) -> ExternResult<Val> {
    // Seems jaq is designed to pipe errors forwards, whilst tracking a global reference - hence
    // the iterator gubbins.
    let vars = vec![];
    let inputs: Vec<Result<Val, String>> = vec![Ok(input)];
    let iter = Box::new(inputs.into_iter()) as Box<dyn Iterator<Item = _>>;
    let iter = RcIter::new(iter);
    let ctx = Ctx::new(vars, &iter);

    // The above iterator dance makes it very hard for me to understand how to take just one item.
    // As a workaround I use a for loop (which the compiler seems happy with) and then error if
    // the loop repeats.
    let mut looped_once = false;
    let mut output: Option<Val> = None;
    for input in &iter {
        if looped_once {
            return Err(wasm_error!(WasmErrorInner::Guest(
                "Unexpected continued input".into()
            )));
        }
        let input = input.map_err(|err| {
            wasm_error!(WasmErrorInner::Guest(format!(
                "Error in jq program input: {}",
                err
            )))
        })?;
        let mut outputs = filter
            .run((ctx.clone(), input))
            .collect::<Result<Vec<_>, _>>()
            .map_err(|err| {
                wasm_error!(WasmErrorInner::Guest(format!(
                    "jq execution error: {}",
                    err
                )))
            })?;
        if outputs.len() > 1 {
            return Err(wasm_error!(WasmErrorInner::Guest(
                "Unexpected multiple outputs to jq program".into()
            )));
        }
        if let Some(val) = outputs.pop() {
            output = Some(val);
        }
        looped_once = true;
    }
    output.ok_or(wasm_error!(WasmErrorInner::Guest(
        "jq program produced no output".into()
    )))
}

pub fn parse_single_json(json: &str) -> ExternResult<Val> {
    let mut iter = json_read(json.as_bytes());
    let val = iter
        .next()
        .ok_or(wasm_error!(WasmErrorInner::Guest("No input parsed".into())))?
        .map_err(|err| {
            wasm_error!(WasmErrorInner::Guest(format!(
                "Input parse failed: {}",
                err
            )))
        })?;
    if iter.next().is_some() {
        return Err(wasm_error!(WasmErrorInner::Guest(
            "Unexpected continuation of input".into()
        )));
    }
    Ok(val)
}

fn json_read<'a>(read: impl BufRead + 'a) -> impl Iterator<Item = io::Result<Val>> + 'a {
    let mut lexer = hifijson::IterLexer::new(read.bytes());
    core::iter::from_fn(move || {
        use hifijson::token::Lex;
        let v = Val::parse(lexer.ws_token()?, &mut lexer);
        Some(v.map_err(|e| core::mem::take(&mut lexer.error).unwrap_or_else(|| invalid_data(e))))
    })
}

fn invalid_data(e: impl std::error::Error + Send + Sync + 'static) -> std::io::Error {
    io::Error::new(io::ErrorKind::InvalidData, e)
}

// Regression test for https://github.com/holochain-open-dev/holoom/issues/59
#[test]
fn no_undefined_vars() {
    let result = compile_filter("$missing");
    assert!(result.is_err())
}
