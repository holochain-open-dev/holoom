#! /bin/bash
hc run-local-services \
    -b $BOOTSTRAP_PORT \
    -s $SIGNAL_PORT \
    --bootstrap-interface 0.0.0.0 \
    --signal-interfaces 0.0.0.0
