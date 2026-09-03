import os

# Example Environment Configurations for Krones Automation
# Copy this to config_local.py or set via bash environment variables.

os.environ["KRONES_OUTPUT_DIR"] = "./output_production"
os.environ["KRONES_STATE_FILE"] = "./kc_production_state.json"
