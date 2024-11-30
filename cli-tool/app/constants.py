from pathlib import Path

# Name of the config file
CONFIG_FILE_NAME = ".tin-config.toml"

# Path to the config file (in the user's home directory)
CONFIG_FILE_PATH = Path.home() / CONFIG_FILE_NAME

# Docker compose file name
DOCKER_COMPOSE_FILE = "tin-docker-compose.yml"
