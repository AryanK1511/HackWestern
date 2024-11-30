import time

import docker

# Initialize the Docker client
client = docker.from_env()
container = client.containers.get("d55d60e50f7a")

# Collect stats every second
while True:
    stats = container.stats(stream=False)

    # Get the CPU usage in seconds (convert from nanoseconds)
    cpu_usage_ns = stats["cpu_stats"]["cpu_usage"]["total_usage"]
    system_cpu_usage_ns = stats["cpu_stats"]["system_cpu_usage"]
    cpu_percentage = 0
    if system_cpu_usage_ns > 0:
        cpu_percentage = (cpu_usage_ns / system_cpu_usage_ns) * 100

    # Get the memory usage in MB (convert from bytes)
    memory_usage_bytes = stats["memory_stats"]["usage"]
    memory_usage_mb = memory_usage_bytes / (1024 * 1024)

    # Get the network stats
    network_stats = stats["networks"]
    network_in = 0
    network_out = 0
    for network in network_stats.values():
        network_in += network["rx_bytes"]
        network_out += network["tx_bytes"]

    # Get the disk I/O stats
    disk_read_mb = 0
    disk_write_mb = 0
    if "storage_stats" in stats:
        disk_read = stats["storage_stats"].get("read", 0)
        disk_write = stats["storage_stats"].get("write", 0)
        disk_read_mb = disk_read / (1024 * 1024)  # Convert bytes to MB
        disk_write_mb = disk_write / (1024 * 1024)  # Convert bytes to MB

    # Print the stats
    print(f"CPU Usage: {cpu_percentage:.2f}%")
    print(f"Memory Usage: {memory_usage_mb:.2f} MB")
    print(f"Network Received: {network_in / (1024 * 1024):.2f} MB")
    print(f"Network Sent: {network_out / (1024 * 1024):.2f} MB")
    print(f"Disk Read: {disk_read_mb:.2f} MB")
    print(f"Disk Write: {disk_write_mb:.2f} MB")

    # Wait 1 second before fetching the next stats
    time.sleep(1)
