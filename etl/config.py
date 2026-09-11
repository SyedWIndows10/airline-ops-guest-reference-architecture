"""Shared config for the ETL scripts. Local-dev defaults match infra/docker-compose.yml."""
import os

KAFKA_BROKERS = os.environ.get("KAFKA_BROKERS", "localhost:9092").split(",")

ODS_DSN = os.environ.get(
    "ODS_DSN",
    "host=localhost port=5432 dbname=ods user=airline_ops password=airline_ops_dev_only",
)

LAKEHOUSE_ROOT = os.environ.get("LAKEHOUSE_ROOT", os.path.join(os.path.dirname(__file__), "_lakehouse"))
