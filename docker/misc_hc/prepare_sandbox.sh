#! /bin/bash
set -e

HAPP_WORKDIR=/happ_workdir
    HAPP_YAML_PATH=$HAPP_WORKDIR/happ.yaml
    PACKED_HAPP_PATH=$HAPP_WORKDIR/holoom.happ
SANDBOX_PATH=/prebuilt_sandbox
    PROPS_TAG_PATH=$SANDBOX_PATH/props_tag
    CONDUCTOR_PATH=$SANDBOX_PATH/conductor
    SANDBOX_ENV_PATH=$SANDBOX_PATH/.env
    UNPACKED_HAPP_PATH=$SANDBOX_PATH/unpacked
APP_WS_PORT=3333
APP_ID=holoom

# External build args:
# NETWORK_SEED
# HOLOCHAIN_LAIR_PASSWORD
# HOLOCHAIN_APP_WS_PORT

echo "Creating sandbox"
mkdir $SANDBOX_PATH
echo $HOLOCHAIN_LAIR_PASSWORD | hc sandbox --piped \
    create -n 1 --root $SANDBOX_PATH -d conductor --in-process-lair \
    network -b https://bootstrap.holo.host webrtc wss://signal.holo.host

if [ ! -z "$HOLOCHAIN_APP_WS_PORT" ]; then
    echo "Adding app port $HOLOCHAIN_APP_WS_PORT"
    echo $HOLOCHAIN_LAIR_PASSWORD | hc sandbox --piped \
        call -e $CONDUCTOR_PATH \
            add-app-ws $HOLOCHAIN_APP_WS_PORT
fi

echo "Adding agent and initialising lair keystore"
NEWAGENT_STDOUT=`echo $HOLOCHAIN_LAIR_PASSWORD | hc \
    sandbox --piped call -e $CONDUCTOR_PATH new-agent`

echo "Caching agent and lair pubkeys"

LAIR_PUBKEY_REGEX='socket\?k=([^ ]+)'
[[ $NEWAGENT_STDOUT =~ $LAIR_PUBKEY_REGEX ]]
HOLOCHAIN_LAIR_PUB_KEY=${BASH_REMATCH[1]}
echo "HOLOCHAIN_LAIR_PUB_KEY=$HOLOCHAIN_LAIR_PUB_KEY" >> $SANDBOX_ENV_PATH

AGENT_PUBKEY_REGEX='Added agent ([^ ]+)'
[[ $NEWAGENT_STDOUT =~ $AGENT_PUBKEY_REGEX ]]
HOLOCHAIN_AGENT_PUBKEY=${BASH_REMATCH[1]}
echo "HOLOCHAIN_AGENT_PUBKEY=$HOLOCHAIN_AGENT_PUBKEY" >> $SANDBOX_ENV_PATH

echo "Saved .env:"
cat $SANDBOX_ENV_PATH

echo "Updating manifest"
# holoom role
yq -i ".roles[0].dna.modifiers.network_seed = \"$HOLOCHAIN_NETWORK_SEED\"" $HAPP_YAML_PATH
yq -i ".roles[0].dna.modifiers.properties.authority_agent = \"$HOLOCHAIN_AGENT_PUBKEY\"" $HAPP_YAML_PATH

echo "Packing happ"
hc app pack $HAPP_WORKDIR

echo "Installing happ"
echo $HOLOCHAIN_LAIR_PASSWORD | hc sandbox --piped \
    call -e $CONDUCTOR_PATH \
        install-app $PACKED_HAPP_PATH --app-id $APP_ID \
            --agent-key $HOLOCHAIN_AGENT_PUBKEY

# Assemble a string for tagging this sandbox with its intialisation parameters
# such that we can cheaply determine whether a container's sandbox matches that
# of the image it was sourced from.
SANDBOX_PROPS="$(holochain --version)"
SANDBOX_PROPS="${SANDBOX_PROPS} $(hc --version)"
SANDBOX_PROPS="${SANDBOX_PROPS} $(lair-keystore  --version)"
SANDBOX_PROPS="${SANDBOX_PROPS} $(sha1sum $PACKED_HAPP_PATH)"
SANDBOX_PROPS="${SANDBOX_PROPS} $NETWORK_SEED"
SANDBOX_PROPS="${SANDBOX_PROPS} $HOLOCHAIN_LAIR_PUB_KEY"
SANDBOX_PROPS="${SANDBOX_PROPS} $HOLOCHAIN_AGENT_PUBKEY"
# Stripping the whitespace makes saving/loading the file less error prone.
SANDBOX_PROPS=$(echo $SANDBOX_PROPS | tr -s ' ' | tr ' ' '_')
echo "SANDBOX_PROPS=\"$SANDBOX_PROPS\""
echo -n $SANDBOX_PROPS > $PROPS_TAG_PATH
