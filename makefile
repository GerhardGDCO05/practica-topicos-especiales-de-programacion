CMP=docker-compose.local.yml
NAME=api-rest-Gerhard

dev:
	docker build -t $(NAME)-dev --target dev . --no-cache
	CURRENT_IMAGE=$(NAME)-dev docker-compose -f $(CMP) up

prod:
	docker build -t $(NAME)-prod --target prod . --no-cache
	CURRENT_IMAGE=$(NAME)-prod docker-compose -f $(CMP) up