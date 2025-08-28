# SurveyJS with Go Backend

A production-ready SurveyJS application with a Go backend that provides A/B testing capabilities for different survey types.

## Features

- **A/B Testing**: Counterbalanced survey assignment for customer feedback, feature polls, and employee satisfaction surveys
- **Multi-language Support**: English, Spanish, and French survey variants
- **PostgreSQL Database**: Stores survey results and impression tracking
- **Docker Support**: Containerized application with PostgreSQL
- **Secure Cookies**: Uses secure cookies for survey assignment persistence

## Architecture

Built with Go for performance and reliability:

- **High Performance**: Go's compiled nature offers improved performance
- **Type Safety**: Strong typing reduces runtime errors
- **Concurrent Safety**: Mutex-protected counterbalancing for thread-safe A/B testing
- **Small Footprint**: Alpine-based Docker image (~15MB vs ~200MB for Node.js)

## Environment Configuration

### Local Development
For local development, the application uses hardcoded values in `docker-compose.yml`:
- `POSTGRES_USER=postgres`
- `POSTGRES_PASSWORD=postgres`
- `POSTGRES_DB=surveydb`

### Production Deployment
For production, you'll need to set environment variables. Create a `.env` file:

```bash
# PostgreSQL Configuration
POSTGRES_USER=your_production_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=your_production_db

# Optional: Customize these for production
POSTGRES_HOST=your_db_host
POSTGRES_PORT=5432
```

**Important**: Never commit `.env` files to version control. The `.gitignore` file already excludes them.

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `POSTGRES_HOST` | PostgreSQL server hostname | `db` (Docker) | Yes |
| `POSTGRES_USER` | Database username | `postgres` | Yes |
| `POSTGRES_PASSWORD` | Database password | `postgres` | Yes |
| `POSTGRES_DB` | Database name | `surveydb` | Yes |
| `POSTGRES_PORT` | Database port | `5432` | No |

## Quick Start

### Prerequisites
- Docker and Docker Compose

### Run with Docker
```bash
docker-compose up --build -d
```

### Access the Application
- **Health Check**: http://localhost:3000/health
- **Customer Feedback**: http://localhost:3000/feedback
- **Feature Polls**: http://localhost:3000/poll
- **Employee Surveys**: http://localhost:3000/employee

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /feedback/{lang}` - Customer feedback A/B test assignment
- `GET /poll/{lang}` - Feature poll A/B test assignment  
- `GET /employee/{lang}` - Employee satisfaction A/B test assignment
- `GET /survey/{surveyName}/{lang}` - Survey page
- `GET /api/surveys/{surveyName}/{lang}` - Survey JSON data
- `POST /api/save-survey` - Save completed survey results

## Database Schema

The application creates two tables:

- `survey_results`: Stores completed survey submissions
- `survey_impressions`: Tracks survey impressions for A/B testing

## A/B Testing Logic

Uses counterbalanced assignment to ensure equal distribution:

- **Customer Feedback**: Alternates between A and B versions
- **Feature Polls**: Alternates between A and B versions  
- **Employee Surveys**: Alternates between A and B versions

Each user gets a consistent assignment via secure cookies for 15 minutes.

## Performance Benefits

- **Faster Startup**: No runtime initialization
- **Lower Memory Usage**: Efficient memory management
- **Better Concurrency**: Native goroutine support
- **Smaller Container**: Alpine-based image (~15MB)

## Production Deployment

This application is ready for production deployment to:
- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Instances
- Kubernetes clusters

### Production Checklist
- [ ] Set secure database credentials
- [ ] Configure environment variables
- [ ] Set up SSL/TLS certificates
- [ ] Configure load balancer
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

## License

ISC


