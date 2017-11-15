## Node.js Application running in Kubernetes with Kube-Lego

Kubernetes makes it easy to deploy containerized applications in the cloud. In our use case we created an application that would require three containers, each running in their own pod. The deployment is split up into an application pod, ocr pod, and a static pod. On top of the base deployment we have setup Kube-Lego to manage TLS certificates.


### Secrets

We setup secrets before the deployment so that we can store sensitive information in Kubernetes that can later be referenced by a variable. In our case we will need a token and clientID to authenticate against the Twitch API. 

```bash
apiVersion: v1
kind: Secret
metadata:
  name: twitch-auth
type: Opaque
data:
  token: YOUR_OAUTH_TOKEN_IN_BASE64
  clientID: YOUR_CLIENT_ID_IN_BASE64
```

### Application Pod

The application pod consists of a single container running our Node.js app. The application polls the Twitch API for Player Unknown Battlegrounds streams. We record part of the stream and pull out a screenshot that can be sent to the OCR pod for processing.

Since we are using secrets, the images are built without sensitive information. In the example below we reference the secret twitch-auth and pull the token needed to authenticate. We also store the clientID, which is required with newer versions of the Twitch API.

```bash
       - name: token
            valueFrom:
              secretKeyRef:
                name: twitch-auth
                key: token
          - name: clientID
            valueFrom:
              secretKeyRef:
                name: twitch-auth
                key: clientID
```

To simplify deployment we are using environment variables for a few values. APP_HOSTNAME is used throughout the deployment to specify the URL for the application. In our production environment the value is set to rotisserie.tv. Since the OCR_HOST is running behind the same URL we set the value to equal the hostname.

```bash
          - name: OCR_HOST
            value: $APP_HOSTNAME
          ports:
            - containerPort: 3000
```

We setup a ClusterIP service for the pod since we aren't worried about getting to it from the outside. A Load Balancer is configured to allow traffic in from the internet. More information is provided on the Load Balancer in the Kube-Lego section.

```bash
apiVersion: v1
kind: Service
metadata:
  name: rotisserie-app
spec:
  ports:
  - port: 3000
    protocol: TCP
    name: rotisserie-app
  selector:
    app: rotisserie-app
```

### OCR Pod

The ocr pod has a single container running an optical character recognition service. Images from the stream are sent over to the OCR service where they are processed. We are looking for the amount of players alive, which is denoted by a number in the top right of the stream. OCR provides the amount of players alive back to the application container where they are processed again to find the person with the lowest count.

The deployment is basic. We're pulling the OCR image and setting the port to 3001, which we'll use later when we setup our Ingress resources.

We are using a ClusterIP for the OCR container. External traffic is managed by the Load Balancer that we setup in Kube-Lego.


```bash
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: rotisserie-ocr
spec:
  template:
    metadata:
      labels:
        app: rotisserie-ocr
    spec:
      containers:
        - name: rotisserie-ocr
          image: $docker_username/rotisserie-ocr:$IMAGE_TAG
          ports:
            - containerPort: 3001
```


### Static Pod

The static pod consists of a single container with Nginx and the static data used for the site. We create an image based on Nginx Alpine and then copy the static data over from the public folder in our repository. The deployment sets the pod up to listen on port 8082 and sets Nginx environment variables to configure the Nginx service. A ClusterIP is used for this service as external traffic is handled by the Load Balancer. 


```bash
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: rotisserie-static
spec:
  replicas: 1
  template:
    metadata:
      labels:
        app: rotisserie-static
    spec:
      containers:
      - name: rotisserie-static
        image: $docker_username/rotisserie-static:$IMAGE_TAG
        imagePullPolicy: Always
        env:
        - name: NGINX_LISTEN
          value: "*:8082"
        ports:
        - containerPort: 8082
```


### Kube-Lego

With Kube-Lego we can generate a certificate, as well as renew it, in an automated way. The first thing we have to configure is the configmap, which will setup the letsencrypt URL and email associated with the certificate.


```bash
apiVersion: v1
metadata:
  name: kube-lego
data:
  lego.email: INSERT_EMAIL_HERE
  lego.url: "https://acme-v01.api.letsencrypt.org/directory"
kind: ConfigMap
```

The deployment references the configmap values and sets them to LEGO_EMAIL and LEGO_URL.

```bash
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: kube-lego
spec:
  replicas: 1
  template:
    metadata:
      labels:
        app: kube-lego
    spec:
      containers:
      - name: kube-lego
        image: jetstack/kube-lego:0.1.5
        imagePullPolicy: Always
        ports:
        - containerPort: 3002
        env:
        - name: LEGO_EMAIL
          valueFrom:
            configMapKeyRef:
              name: kube-lego
              key: lego.email
        - name: LEGO_URL
          valueFrom:
            configMapKeyRef:
              name: kube-lego
              key: lego.url
        - name: LEGO_POD_IP
          valueFrom:
            fieldRef:
              fieldPath: status.podIP
```

The Kube-Lego deployment will also configure an ingress resource and manage it. The values configured in this ingress resource are hard coded. At this time there is not an option to configure custom annotations. SSL-Redirect is configured as false in this resource so that letsencrypt can challenge on port 80:/.well-known/acme-challenge.

```bash
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    ingress.kubernetes.io/ssl-redirect: "false"
    ingress.kubernetes.io/whitelist-source-range: 0.0.0.0/0
    kubernetes.io/ingress.class: nginx
    kubernetes.io/tls-acme-challenge-endpoints: "true"
  creationTimestamp:
  generation: 5
  name: kube-lego-nginx
  namespace: default
  resourceVersion: "3096053"
  selfLink: /apis/extensions/v1beta1/namespaces/default/ingresses/kube-lego-nginx
  uid: 
spec:
  rules:
  - host: rotisserie.tv
    http:
      paths:
      - backend:
          serviceName: kube-lego-nginx
          servicePort: 8080
        path: /.well-known/acme-challenge
status:
  loadBalancer:
    ingress:
    - ip:
```

A load balancer service is configured to provide a public IP address. The service will listen on 80 and 443, so we can accept challenge requests from letsencrypt on 80 and then serve the site on 443. In the ingress resource we force SSL redirects when the path matches /, /current, /all. Once the Load Balancer service has been setup we pull the IP address and then configure an A record for our domain so that it points at the IP.

```bash
apiVersion: v1
kind: Service
metadata:
  name: nginx
  namespace: default
spec:
  type: LoadBalancer
  ports:
  - port: 80
    name: http
  - port: 443
    name: https
  selector:
    app: nginx
```

Kube-Lego supports the Nginx Ingress Controller and GCE. The Nginx default deployment is used in our cluster. When ingress resources are configured the Nginx Ingress Controller will configure the Nginx pod by editing the Nginx.conf file and then it will reload the service. The ingress controller needs a default backend so we use a basic backend service that can be hit when the domain is not valid. Hitting the LB IP directly will result in - default backend - 404, since we are only configuring ingress to handle Rotisserie.tv (or the APP_DOMAIN value.)

```bash
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: nginx
  namespace: default
spec:
  replicas: 1
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - image: gcr.io/google_containers/nginx-ingress-controller:0.8.3
        name: nginx
        imagePullPolicy: Always
        env:
          - name: POD_NAME
            valueFrom:
              fieldRef:
                fieldPath: metadata.name
          - name: POD_NAMESPACE
            valueFrom:
              fieldRef:
                fieldPath: metadata.namespace
        livenessProbe:
          httpGet:
            path: /healthz
            port: 10254
            scheme: HTTP
          initialDelaySeconds: 30
          timeoutSeconds: 5
        ports:
        - containerPort: 80
        - containerPort: 443
        args:
        - /nginx-ingress-controller
        - --default-backend-service=default/default-http-backend
        - --nginx-configmap=default/nginx
```

The rotisserie-ingress resource allows us to specify different annotations. In our case we want to redirect http traffic to https. This is where we also configure the different backends. The values are used by the Nginx pod to configure the Nginx.conf. When the values are updated you can view changes to the configuration as well as a reload in the pod by watching the logs.

```bash
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: rotisserie-ingress
  annotations:
    kubernetes.io/tls-acme: "true"
    ingress.kubernetes.io/ssl-redirect: "true"
    kubernetes.io/ingress.class: nginx
spec:
  tls:
  - secretName: rotisserie-tls
    hosts:
    - $APP_HOSTNAME
  rules:
  - host: $APP_HOSTNAME
    http:
      paths:
      - path: /current
        backend:
          serviceName: rotisserie-app
          servicePort: 3000
      - path: /
        backend:
          serviceName: rotisserie-static
          servicePort: 8082
      - path: /all
        backend:
          serviceName: rotisserie-app
          servicePort: 3000
```

## Deploy

The deployment process is simplified by using a Makefile. It is easier to track development changes by tagging based on revision. By default we are using docker hub to host images. Using a docker_username variable makes it easier for other to deploy the application as well.

Normally when we deploy we are running make roll.

```bash
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

delete-deployments:
    kubectl delete deployment rotisserie-app
    kubectl delete deployment rotisserie-ocr

redeploy: delete-deployments deploy

roll: set-rev images tag-images upload-images deploy
```


## Conclusion

Originally we were running the application on a VM with Nginx. Deployments were a little bit slower and were a manual process. We eventually containerized the application to speed up development. We ran into a few issues with sensitive data - do we include it in the image build or set it as environment variables in the container? In the end we were setting environment variables and would create the container with -e values, however it was harder to manage. Using Kubernetes allows us to setup secrets which can simplify storing sensitive data. Service discover also allows us to set variables for values instead of hard coding them. Now we can make updates to the application and push those changes within a few minutes. Most of the time is spent uploading the new images.

SSL/TLS configuration with Kube-Lego allows us to quickly get certificates across multiple domains which is very helpful with test environments. Kubernetes removes a lot of the manual work and allows us to focus more on development.
