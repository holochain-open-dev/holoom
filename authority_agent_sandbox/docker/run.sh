#! /bin/bash

PREBUILT_SANDBOX_PATH=/prebuilt_sandbox
    PREBUILT_PROPS_TAG_PATH=$PREBUILT_SANDBOX_PATH/props_tag
HC_DATA_PATH=/opt/hc_data
    ACTIVE_SANDBOX_PATH=$HC_DATA_PATH/sandbox
        ACTIVE_PROPS_TAG_PATH=$ACTIVE_SANDBOX_PATH/props_tag
        ACTIVE_CONDUCTOR_PATH=$ACTIVE_SANDBOX_PATH/conductor
            ACTIVE_CONDUCTOR_CONFIG_PATH=$ACTIVE_CONDUCTOR_PATH/conductor-config.yaml
APP_WS_PORT_INTERNAL=3333
APP_WS_PORT_EXTERNAL=3334
MIN_EPHEMERAL_UDP_PORT=40000
MAX_EPHEMERAL_UDP_PORT=40255

if ! [[ -f $ACTIVE_PROPS_TAG_PATH ]]; then
    echo "First run - copying prebuilt sandbox"
    mkdir $HC_DATA_PATH
    cp -a $PREBUILT_SANDBOX_PATH $ACTIVE_SANDBOX_PATH

elif cmp --silent -- "$PREBUILT_PROPS_TAG_PATH" "$ACTIVE_PROPS_TAG_PATH"; then
    echo "PROPS_TAG match - using existing sandbox"
else
    echo "PROPS_TAG changed - cleaning and replacing sandbox"
    rm -rf $ACTIVE_SANDBOX_PATH
    cp -a $PREBUILT_SANDBOX_PATH $ACTIVE_SANDBOX_PATH
fi

echo "Pinning ephemeral UDP port range $MIN_EPHEMERAL_UDP_PORT-$MAX_EPHEMERAL_UDP_PORT"
yq -i ".network.tuning_params.tx5_min_ephemeral_udp_port = \"$MIN_EPHEMERAL_UDP_PORT\"" $ACTIVE_CONDUCTOR_CONFIG_PATH
yq -i ".network.tuning_params.tx5_max_ephemeral_udp_port = \"$MAX_EPHEMERAL_UDP_PORT\"" $ACTIVE_CONDUCTOR_CONFIG_PATH

echo "Exposing app port localhost:$APP_WS_PORT_INTERNAL on 0.0.0.0:$APP_WS_PORT_EXTERNAL"
socat TCP-LISTEN:$APP_WS_PORT_EXTERNAL,fork TCP:localhost:$APP_WS_PORT_INTERNAL &

# for i in $(seq $MIN_EPHEMERAL_UDP_PORT $MAX_EPHEMERAL_UDP_PORT)
# do
#     echo "Exposing ephemeral port localhost:$i on 0.0.0.0:$i"
#     socat TCP-LISTEN:$i,fork TCP:localhost:$i &
# done


echo "Starting holochain"
echo $HOLOCHAIN_LAIR_PASSWORD | RUST_LOG=debug holochain \
    -c $ACTIVE_CONDUCTOR_CONFIG_PATH --piped