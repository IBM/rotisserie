# Rotisserie
[![npm 版本](https://badge.fury.io/js/pubgredzone.svg)](https://badge.fury.io/js/pubgredzone)
[![构建状态](https://api.travis-ci.org/IBM/rotisserie.svg?branch=master)](https://travis-ci.org/IBM/rotisserie)
[![Docker 自动化构建](https://img.shields.io/docker/automated/jrottenberg/ffmpeg.svg)](https://hub.docker.com/r/eggshell/rotisserie/)
[![许可](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

*阅读本文的其他语言版本：[English](README.md)。*

[**正在直播**](http://rotisserie.tv)

Rotisserie 采用了美式橄榄球比赛中的[红区](https://en.wikipedia.org/wiki/Red_zone_(gridiron_football))这一概念，
将其应用于非常受欢迎的网络大逃杀游戏
[PLAYERUNKNOWN'S BATTLEGROUNDS](https://www.playbattlegrounds.com/main.pu)。这里的
设想始终是观看游戏中存活人数最少的
最受欢迎的 PUBG Twitch 直播。

## 包含的组件

- [Kubernetes 集群](https://console.ng.bluemix.net/docs/containers/cs_ov.html#cs_ov)

## 精选技术

- [容器编排](https://www.ibm.com/cloud-computing/bluemix/containers)
- [微服务](https://www.ibm.com/developerworks/community/blogs/5things/entry/5_things_to_know_about_microservices?lang=en)
- [Node.js](https://nodejs.org/)

# 前提条件

必须具备以下软件才能在本地运行 Rotisserie：

* [tesseract-ocr](https://github.com/tesseract-ocr/tesseract)
* [ffmpeg](https://ffmpeg.org/)
* [imagemagick](https://www.imagemagick.org/script/index.php)
* [livestreamer](https://github.com/chrippa/livestreamer)

您可以使用以下两个命令之一来安装这些依赖项
（具体取决于您的操作系统）：

* Ubuntu：

```shell
  $ sudo apt-get install tesseract-ocr ffmpeg imagemagick
  $ pip install livestreamer
```

* macOS：

```shell
  $ brew install tesseract ffmpeg imagemagick
  $ pip install livestreamer
```

使用 [Minikube](https://kubernetes.io/docs/getting-started-guides/minikube) 创建 Kubernetes 集群以执行本地测试，或者使用 [IBM Cloud Container Service](https://github.com/IBM/container-journey-template/blob/master/README.md) 创建 Kubernetes 集群以部署到云中。使用 Travis，针对[来自 IBM Cloud Container Service 的 Kubernetes 集群](https://console.ng.bluemix.net/docs/containers/cs_ov.html#cs_ov)定期来测试这里的代码。

# 步骤

1.[获得 Livestreamer 的 OAuth 令牌](#1-getting-an-oauth-token-for-twitch)

2.[设置环境变量](#2-setting-up-environment-variables)

3.[构建映像](#3-build-the-images)

4.[在本地部署](#4-running-it-locally)

5.[使用 Docker 进行部署](#5-running-in-a-container)

6.[使用 Kubernetes 进行部署](#6-running-in-kubernetes)

## 1.获取 Twitch 的 OAuth 令牌

1.在安装有浏览器的机器上，运行以下命令：

```shell
  $ livestreamer --twitch-oauth-authenticate
```

2.将打开一个浏览器窗口，系统将提示您授权 Livestreamer 使用
   您的 Twitch 帐户。单击 `Authorize`。

3.您的浏览器将进行刷新，并出现一个显示“SORRY, this page does not exist 
   yet”消息的页面。请忽略此消息。地址栏中将出现一个回调
   URL，其中包含 `access_token=<TOKEN>`。这是您的 OAuth 令牌，将其复制下来，
   前进到下一部分。

## 2.设置环境变量

* 为您的 Docker 用户名创建一个环境变量。

```shell
  $ export docker_username="YOUR_DOCKER_USERNAME"
```

* 为您在上一步中检索的令牌创建一个环境变量。

```shell
  $ export token="YOUR_OAUTH_TOKEN"
```

* 为您的 clientID 创建一个环境变量。

*必须使用开发人员方式 (https://dev.twitch.tv/) 在 Twitch 帐户中创建应用程序以检索 clientID*

```shell
  $ export clientID="YOUR_CLIENT_ID"
```

* 为 ROTISSERIE_OCR_SERVICE_HOST 和 ROTISSERIE_OCR_SERVICE_PORT 创建一个环境变量。如果在本地运行的话，可以将此项设置为 ``localhost`` 和 ``3001``，  或者如果在容器运行的话，可以将其设置为远程 OCR 主机的 IP 地址和端口。模拟 Kubernetes 导出的环境变量。

```shell
  $ export ROTISSERIE_OCR_SERVICE_HOST="localhost"
  $ export ROTISSERIE_OCR_SERVICE_PORT="3001"
```

## 3.构建映像

* 克隆存储库。

```shell
 $ git clone https://github.com/IBM/rotisserie.git
 $ cd rotisserie
```

* 构建并推送 Docker 映像。如果要在 Kubernetes 中部署应用程序，那么需要推送 Docker 映像。

```shell
$ docker build -t $docker_username/rotisserie-ocr -f deploy/images/ocr.Dockerfile .
$ docker build -t $docker_username/rotisserie-app -f deploy/images/app.Dockerfile .
$ docker push $docker_username/rotisserie-ocr
$ docker push $docker_username/rotisserie-app
```

## 4.在本地运行该应用程序

* 使用 npm 执行安装。

```shell
  $ npm install .
```

* 如果不在 `rotisserie` 目录中，请浏览至该目录，然后启动
  该应用程序：

```shell
  $ node ocr.js 2>&1 >/dev/null &
  $ node app.js
```

现在，您可以打开浏览器并浏览至 `http://localhost:3000` 以观看
Rotisserie。

## 5.在容器中运行

您还可以在 Docker 容器中运行 Rotisserie。

* 启动容器：

```shell
  $ docker run -d -p 3001:3001 --name rotisserie-ocr $docker_username/rotisserie-ocr
  $ docker run -d -p 3000:3000 --name rotisserie-app -e ROTISSERIE_OCR_SERVICE_HOST=$ROTISSERIE_OCR_SERVICE_HOST -e ROTISSERIE_OCR_SERVICE_PORT=$ROTISSERIE_OCR_SERVICE_PORT -e token=$token -e clientID=$clientID $docker_username/rotisserie-app
```

现在，您可以打开浏览器并浏览至 `http://localhost:3000` 以观看
Rotisserie。

## 6.在 Kubernetes 中运行

**注**：确保将 `$OCR_HOST` 环境变量设置为 `cluster_public_ip:3001`。

1.为您的 OAuth 令牌创建 Kubernetes 密钥。必须对 Kubernetes 密钥所需的数据进行 Base64 编码。

```shell
$ echo -n "YOUR_OAUTH_TOKEN" | base64
```

2.修改 rotisserie-secrets.yaml 文件以使用您的令牌。

```yaml
...
data:
  token: YOUR_OAUTH_TOKEN_IN_BASE64
```

3.最后，创建 Kubernetes 密钥。

```shell
$ kubectl create -f rotisserie-secrets.yaml
```

4.修改 `rotisserie-app.yaml` 和 `rotisserie-ocr.yaml` yaml 文件以使用您的映像。

```yaml
...
    containers:
    - name: rotisserie-app
      image: <docker_username>/rotisserie-app
```

5.部署 OCR 服务，然后部署主应用程序。

```shell
$ kubectl apply -f rotisserie-ocr.yaml
$ kubectl apply -f rotisserie-app.yaml
```

* 要访问该应用程序：需要集群的公共 IP 地址。如果没有负载均衡器，那么可以使用 Node Port。

```shell
# For clusters provisioned with Bluemix
$ bx cs workers YOUR_CLUSTER_NAME

# For Minikube
$ minikube ip
```

* 现在，您可以转至 `http://IP_ADDRESS:30080`

### 生产详细信息

生产版 Rotisserie 的操作过程略有不同。生产版 Kubernetes 清单位于部署目录中。通常使用提供的 Makefile 来与之交互。在生产版 Rotisserie 与开发人员教程中使用的 Rotisserie 之间的主要差别在于：在 Kuberenetes 中使用入口控制器并添加了 Letsencrypt。

可使用以下几个命令来处理部署。

要在不使用 Letsencrypt 的情况下进行部署，可以使用 make roll
```
make roll
```

要在使用 letsencrypt 的情况下进行部署，可以使用 make full-roll
```
make full-roll
```

要在不移除 svc/ing/other 的情况下重新部署，可以使用 make redeploy
```
make redeploy
```

要删除整个部署，可以使用 make purge
```
make purge
```

注：这取决于是否是使用唯一 sha 进行部署。请参阅 Makefile 中的 make-rev 规则。在大多数情况下应可以使用 ``git pull; make roll``。如果滚动失败或应用程序因未连接到代码而失败，可能需要在重新滚动之前添加虚拟提交。请仅从主项滚动。

## 将直播加入白名单和黑名单
要加入白名单，只需将名为 `ROTISSERIE_WHITELIST` 的环境变量设置为包含空格分隔的用户名的字符串。加入黑名单的过程与此相同，但使用的是环境变量 `ROTISSERIE_BLACKLIST`。


## 许可

Rotisserie 当前是在 [Apache 2.0 许可](LICENSE) 下授予许可的。
