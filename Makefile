SHELL := /bin/bash
REV_FILE=.make-rev-check

set-rev:
	git rev-parse --short HEAD > $(REV_FILE)

images: set-rev
	./deploy/images/make-image.sh deploy/images/app.Dockerfile "rotisserie-app:$$(cat $(REV_FILE))"
	./deploy/images/make-image.sh deploy/images/ocr.Dockerfile "rotisserie-ocr:$$(cat $(REV_FILE))"
	./deploy/images/make-image.sh deploy/images/static-server.Dockerfile "rotisserie-static:$$(cat $(REV_FILE))"

tag-images: set-rev
	sudo docker tag "rotisserie-app:$$(cat $(REV_FILE))" "$$docker_username/rotisserie-app:$$(cat $(REV_FILE))"
	sudo docker tag "rotisserie-ocr:$$(cat $(REV_FILE))" "$$docker_username/rotisserie-ocr:$$(cat $(REV_FILE))"
	sudo docker tag "rotisserie-static:$$(cat $(REV_FILE))" "$$docker_username/rotisserie-static:$$(cat $(REV_FILE))"

upload-images: set-rev
	sudo docker push "$$docker_username/rotisserie-app:$$(cat $(REV_FILE))"
	sudo docker push "$$docker_username/rotisserie-ocr:$$(cat $(REV_FILE))"
	sudo docker push "$$docker_username/rotisserie-static:$$(cat $(REV_FILE))"

.PHONY: deploy
deploy: set-rev
	IMAGE_TAG=$$(cat $(REV_FILE)) envsubst < deploy/rotisserie.yaml | kubectl apply -f -

kube-lego: set-rev
	IMAGE_TAG=$$(cat $(REV_FILE)) envsubst < deploy/kube-lego.yaml | kubectl apply -f -

delete-deployments:
	kubectl delete deployment rotisserie-app
	kubectl delete deployment rotisserie-ocr

redeploy: delete-deployments deploy

roll: set-rev images tag-images upload-images deploy

full-roll: set-rev images tag-images upload-images deploy kube-lego

purge:
	kubectl delete -f deploy/rotisserie.yaml
	kubectl delete -f deploy/kube-lego
	kubectl delete -f twitch-auth-secrets.yaml
	kubectl delete -f letsencrypt.yaml
