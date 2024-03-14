#! /bin/bash

RAW_HAPP_PATH=/game_identity.happ
SANDBOX_PATH=/prebuilt_sandbox
    PROPS_TAG_PATH=$SANDBOX_PATH/props_tag
    CONDUCTOR_PATH=$SANDBOX_PATH/conductor
    SANDBOX_ENV_PATH=$SANDBOX_PATH/.env
    UNPACKED_HAPP_PATH=$SANDBOX_PATH/unpacked
        HAPP_YAML_PATH=$UNPACKED_HAPP_PATH/happ.yaml
    REPACKED_HAPP_PATH=$SANDBOX_PATH/repacked.happ
APP_WS_PORT=3333
APP_ID=game-identity

# External build args:
# NETWORK_SEED
# HOLOCHAIN_LAIR_PASSWORD

echo "Creating sandbox"
mkdir $SANDBOX_PATH
echo $HOLOCHAIN_LAIR_PASSWORD | hc sandbox --piped \
    create -n 1 --root $SANDBOX_PATH -d conductor --in-process-lair \
    network -b https://bootstrap.holo.host webrtc wss://signal.holo.host

echo "Adding app websocket"
echo $HOLOCHAIN_LAIR_PASSWORD | hc sandbox --piped \
    call -e $CONDUCTOR_PATH \
        add-app-ws $APP_WS_PORT

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

echo "Unpacking raw happ"
hc app unpack -o $UNPACKED_HAPP_PATH $RAW_HAPP_PATH

echo "Updating manifest"
# game_identity role
yq -i ".roles[0].dna.modifiers.network_seed = \"$HOLOCHAIN_NETWORK_SEED\"" $HAPP_YAML_PATH
yq -i ".roles[0].dna.modifiers.properties.authority_agent = \"$HOLOCHAIN_AGENT_PUBKEY\"" $HAPP_YAML_PATH

echo "Repacking happ"
hc app pack -o $REPACKED_HAPP_PATH $UNPACKED_HAPP_PATH

echo "Installing happ"
echo $HOLOCHAIN_LAIR_PASSWORD | hc sandbox --piped \
    call -e $CONDUCTOR_PATH \
        install-app $REPACKED_HAPP_PATH --app-id $APP_ID \
            --agent-key $HOLOCHAIN_AGENT_PUBKEY

# Assemble a string for tagging this sandbox with its intialisation parameters
# such that we can cheaply determine whether a container's sandbox matches that
# of the image it was sourced from.
SANDBOX_PROPS="$(holochain --version)"
SANDBOX_PROPS="${SANDBOX_PROPS} $(hc --version)"
SANDBOX_PROPS="${SANDBOX_PROPS} $(lair-keystore  --version)"
SANDBOX_PROPS="${SANDBOX_PROPS} $(sha1sum $RAW_HAPP_PATH)"
SANDBOX_PROPS="${SANDBOX_PROPS} $NETWORK_SEED"
SANDBOX_PROPS="${SANDBOX_PROPS} $HOLOCHAIN_LAIR_PUB_KEY"
SANDBOX_PROPS="${SANDBOX_PROPS} $HOLOCHAIN_AGENT_PUBKEY"
# Stripping the whitespace makes saving/loading the file less error prone.
SANDBOX_PROPS=$(echo $SANDBOX_PROPS | tr -s ' ' | tr ' ' '_')
echo "SANDBOX_PROPS=\"$SANDBOX_PROPS\""
echo -n $SANDBOX_PROPS > $PROPS_TAG_PATH
