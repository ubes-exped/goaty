#!/usr/bin/env sh

export RABBITMQ_NODE_IP_ADDRESS=127.0.0.1
export ERL_EPMD_ADDRESS=127.0.0.1
export RABBITMQ_NODENAME=rabbit@localhost

cleanup() {
    rabbitmqctl shutdown
    trap - INT
    kill -s INT "$$"
}

trap cleanup INT

wait_and_start() {
    sleep 5
    rabbitmqctl await_startup
    yarn start
    rabbitmqctl shutdown
}

rabbitmq-server -detached 2> /dev/null && wait_and_start