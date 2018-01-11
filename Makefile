SHELL := /bin/bash
REV_FILE=.make-rev-check

# Sets the revision
set-rev:
	git rev-parse --short HEAD > $(REV_FILE)

# Creates images for app, ocr, and static containers
images: set-rev
	./deploy/images/make-image.sh deploy/images/app.Dockerfile "rotisserie-app:$$(cat $(REV_FILE))"
	./deploy/images/make-image.sh deploy/images/ocr.Dockerfile "rotisserie-ocr:$$(cat $(REV_FILE))"
	./deploy/images/make-image.sh deploy/images/static-server.Dockerfile "rotisserie-static:$$(cat $(REV_FILE))"

# Tags images in docker based on the environment variable docker_username and revision
tag-images: set-rev
	sudo docker tag "rotisserie-app:$$(cat $(REV_FILE))" "$$docker_username/rotisserie-app:$$(cat $(REV_FILE))"
	sudo docker tag "rotisserie-ocr:$$(cat $(REV_FILE))" "$$docker_username/rotisserie-ocr:$$(cat $(REV_FILE))"
	sudo docker tag "rotisserie-static:$$(cat $(REV_FILE))" "$$docker_username/rotisserie-static:$$(cat $(REV_FILE))"

# Upload images to docker (Login to Docker before Uploading: docker login)
upload-images: set-rev
	sudo docker push "$$docker_username/rotisserie-app:$$(cat $(REV_FILE))"
	sudo docker push "$$docker_username/rotisserie-ocr:$$(cat $(REV_FILE))"
	sudo docker push "$$docker_username/rotisserie-static:$$(cat $(REV_FILE))"

# Creates twitch-auth secret needed for the app container
secrets:
	kubectl create -f twitch-auth-secrets.yaml

# Deploy based on the rotisserie.yaml file
.PHONY: deploy
deploy: set-rev
	IMAGE_TAG=$$(cat $(REV_FILE)) envsubst < deploy/rotisserie.yaml | kubectl apply -f -

# Deploy kube-lego based on the kube-lego.yaml file
kube-lego: set-rev
	kubectl create -f letsencrypt.yaml
	IMAGE_TAG=$$(cat $(REV_FILE)) envsubst < deploy/kube-lego.yaml | kubectl apply -f -

# Deletes deployments
delete-deployments:
	kubectl delete deploy rotisserie-app
	kubectl delete deploy rotisserie-ocr
	kubectl delete deploy rotisserie-static

# Deletes deployments and then deploys
redeploy: delete-deployments deploy

# Creates a new deployment from scratch, without kube-lego
roll: set-rev images tag-images upload-images secrets deploy

# Creates a new deployment from scratch, with kube-lego
full-roll: set-rev images tag-images upload-images kube-lego secrets deploy

# Deletes deployments based on deployment files
purge:
	kubectl delete -f deploy/rotisserie.yaml || true
	kubectl delete -f deploy/kube-lego.yaml || true
	kubectl delete -f twitch-auth-secrets.yaml || true
	kubectl delete -f letsencrypt.yaml || true
