SHELL := /bin/bash
REV_FILE=.make-rev-check

set-rev:
	git rev-parse --short HEAD > $(REV_FILE)

images: set-rev
	./deploy/images/make-image.sh deploy/images/app.Dockerfile "pubgredzone-app:$$(cat $(REV_FILE))"
	./deploy/images/make-image.sh deploy/images/ocr.Dockerfile "pubgredzone-ocr:$$(cat $(REV_FILE))"
	./deploy/images/make-image.sh deploy/images/static-server.Dockerfile "pubgredzone-static:$$(cat $(REV_FILE))"

tag-images: set-rev
	sudo docker tag "pubgredzone-app:$$(cat $(REV_FILE))" "container-registry.dev.ibmesports.com/pubgredzone-app:$$(cat $(REV_FILE))"
	sudo docker tag "pubgredzone-ocr:$$(cat $(REV_FILE))" "container-registry.dev.ibmesports.com/pubgredzone-ocr:$$(cat $(REV_FILE))"
	sudo docker tag "pubgredzone-static:$$(cat $(REV_FILE))" "container-registry.dev.ibmesports.com/pubgredzone-static:$$(cat $(REV_FILE))"

upload-images: set-rev
	sudo docker push "container-registry.dev.ibmesports.com/pubgredzone-app:$$(cat $(REV_FILE))"
	sudo docker push "container-registry.dev.ibmesports.com/pubgredzone-ocr:$$(cat $(REV_FILE))"
	sudo docker push "container-registry.dev.ibmesports.com/pubgredzone-static:$$(cat $(REV_FILE))"

.PHONY: deploy
deploy: set-rev
	IMAGE_TAG=$$(cat $(REV_FILE)) envsubst < deploy/pubgredzone.yaml | kubectl apply -f -

delete-deployments:
	kubectl delete deployment pubgredzone-app
	kubectl delete deployment pubgredzone-ocr

redeploy: delete-deployments deploy
