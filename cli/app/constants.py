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
    {
        "name": "Ubuntu20.04",
        "image": "ubuntu:20.04",
        "enabled": True,
    },
    {
        "name": "Ubuntu22.04",
        "image": "ubuntu:22.04",
        "enabled": True,
    },
    {
        "name": "Ubuntu24.04",
        "image": "ubuntu:24.04",
        "enabled": True,
    },
    {
        "name": "Ubuntu24.10",
        "image": "ubuntu:24.10",
        "enabled": True,
    },
    {
        "name": "Ubuntu25.04",
        "image": "ubuntu:25.04",
        "enabled": True,
    },
    {
        "name": "DebianBullseye",
        "image": "debian:bullseye",
        "enabled": True,
    },
    {
        "name": "DebianBookworm",
        "image": "debian:bookworm",
        "enabled": True,
    },
    {
        "name": "OracleLinux9",
        "image": "oraclelinux:9",
        "enabled": True,
    },
    {
        "name": "OracleLinux8.10",
        "image": "oraclelinux:8.10",
        "enabled": True,
    },
    {
        "name": "OracleLinux8",
        "image": "oraclelinux:8",
        "enabled": True,
    },
    {
        "name": "AmazonLinux2023",
        "image": "amazonlinux:2023",
        "enabled": True,
    },
]
