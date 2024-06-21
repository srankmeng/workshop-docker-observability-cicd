# Workshop docker cicd

> [!IMPORTANT]  
> **Goal:** Create CI/CD pipeline with Jenkins

Steps

1. Running Jenkins
2. Add credential
3. Setup pipeline & create ci
4. Create cd (Add deployment to pipeline)
5. Checking results

![diagram](images/diagram.png)

---

## 1. Running Jenkins in machine

Start Jenkins

```sh
docker compose up jenkins
```

Go to <http://localhost:5555>

Copy your container id by `docker ps | grep jenkins`

Get your password by replace `<CONTAINER_ID>` with output form `docker ps | grep jenkins`

```sh
docker exec <CONTAINER_ID> cat /var/jenkins_home/secrets/initialAdminPassword
```

Choosing `install suggested plugin` and waiting a moment

Filling username, password, full name and email
![setup01](images/setup01.png)

Setting Jenkins URL: `http://localhost:5555/` (by default)

Then restart jenkins and run again

```sh
docker compose up -d jenkins
```

---

## 2. Add docker hub credential

Go to <http://localhost:5555/manage/credentials/store/system/domain/_/>

Click `Add credential` button
![setup02](images/setup02.png)

- Kind: Username with password
- Scope: Global
- Username: `YOUR_DOCKER_HUB_USER`
- Password: `YOUR_DOCKER_HUB_PASSWORD`
- ID: docker_hub
- Description: docker hub

![setup03](images/setup03.png)

---

## 3. Setup pipeline & create ci

On first page click `+ New Item` menu

Enter pipeline name for example `demo_pipeline`

Click `Pipeline` option and submit

then input code to pipeline script

```sh
pipeline {
    agent any

    stages {
        stage('Checkout code') {
            steps {
              git branch: 'main', url: 'https://github.com/srankmeng/workshop-docker-cicd.git'
            }
        }
        stage('Code analysis') {
            steps {
                echo 'Code analysis'
            }
        }
        stage('Unit test') {
            steps {
                echo 'Unit test'
            }
        }
        stage('Code coverage') {
            steps {
                echo 'Code coverage'
            }
        }
        stage('Build images') {
            steps {
                sh 'docker compose build json_server'
            }
        }
        stage('Setup & Provisioning') {
            steps {
                sh 'docker compose up json_server -d'
            }
        }
        stage('Run api automate test') {
            steps {
                sh 'docker compose build postman'
                sh 'docker compose up postman'
            }
        }
        # stage('Push Docker Image to Docker Hub') {
        #     steps {
        #         withCredentials([usernamePassword(credentialsId: 'docker_hub', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
        #             sh 'docker login -u $DOCKER_USER -p $DOCKER_PASS'
        #             sh '''docker image tag my_json_server:1.0 $DOCKER_USER/my_json_server:$BUILD_NUMBER
        #                     docker image push $DOCKER_USER/my_json_server:$BUILD_NUMBER'''
        #         }        
        #     }
        # }     
    }
    post {
        always {
            sh 'docker compose down json_server'
        }
    }
}
```

---

### 4.1 Add deployment to pipeline

Add 'Deploy application' stage after `stage('Push Docker Image to Docker Hub')`

```
        stage('Deploy application') {
            steps {
                withKubeConfig([credentialsId: 'kube_config']) {
                    sh 'kubectl apply -f ./workshops/12_pipeline/deploy/service.yml'
                    sh 'kubectl apply -f ./workshops/12_pipeline/deploy/ingress.yml'
                    withCredentials([usernamePassword(credentialsId: 'docker_hub', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                        sh 'kubectl set image deployment/json-server-deployment json-server=$DOCKER_USER/my_json_server:$BUILD_NUMBER'
                    }
                } 
            }
        }
        stage('Rollout status') {
            steps {
                withKubeConfig([credentialsId: 'kube_config']) {
                    sh 'kubectl rollout status deployment/json-server-deployment --timeout=3m'
                } 
            }
        }
```
Go to `http://localhost:8888`

Check resources
```
kubectl get all
```

---

### 4.2 Polling git for trigger pipelines
Go to the pipeline: Configure > Build Triggers > Poll SCM > input `* * * * *`

---

### Blue Ocean - plugin

Manage Jenkins > Plugins > Available plugins > search `blue ocean` > checked and install

---

### Clean cluster

Delete cluster
```
k3d cluster delete my-cluster
```