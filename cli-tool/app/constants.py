from pathlib import Path

# Name of the config file
CONFIG_FILE_NAME = ".tin-config.toml"

# Path to the config file (in the user's home directory)
CONFIG_FILE_PATH = Path.home() / CONFIG_FILE_NAME

# Docker compose file name
DOCKER_COMPOSE_FILE = "tin-docker-compose.yml"

# Name of the output file for the stats
OUTPUT_FILE_NAME = "tin-report.csv"

# Default machines to be used
MACHINES = [
    {"name": "Ubuntu20.04", "image": "ubuntu:20.04", "enabled": True},
    {"name": "Debian11", "image": "debian:bullseye", "enabled": True},
]
