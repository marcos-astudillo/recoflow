# Recoflow Architecture

## Overview

Recoflow is a distributed recommendation system designed to deliver personalized recommendations with low latency.

## Components

- API Layer (Fastify)
- Candidate Generator
- Ranking Service
- Feature Store (Redis + PostgreSQL)
- Event Streaming (Kafka)
- Offline Training Pipeline

## Data Flow

1. Client requests recommendations
2. Cache lookup (Redis)
3. Candidate generation
4. Ranking
5. Response returned
6. Events collected → Kafka → Storage → Training