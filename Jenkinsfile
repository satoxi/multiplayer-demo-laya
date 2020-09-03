// @see https://jenkins.io/doc/pipeline/steps/
def getBuildUser() {
    wrap([$class: 'BuildUser']) {
        return env.BUILD_USER
    }
}

def buildFrom() {
    def userId = getBuildUser()
    return "[${env.JOB_NAME} #${env.BUILD_NUMBER}](${env.RUN_DISPLAY_URL}) build by ${userId}"
}

def chatOK(String msg, attmtMsg = "", commitLog = false) {
    from = buildFrom()
    msg = "${msg} - ${from}"
    if (commitLog) {
        // chanlogs = buildChangeLogs()
        // attmtMsg = "${attmtMsg}\n==== CHANGELOG ====\n${chanlogs}"
    }
    bearychatSend(channel: "持续集成", message: msg, color: "green", attachmentText: attmtMsg)
}

def chatFail(String msg, attmtMsg = "", commitLog = false) {
    from = buildFrom()
    msg = "${msg} - ${from}"
    if (commitLog) {
        // chanlogs = buildChangeLogs()
        // attmtMsg = "${attmtMsg}\n==== CHANGELOG ====\n${chanlogs}"
    }
    bearychatSend(channel: "持续集成", message: msg, color: "red", attachmentText: attmtMsg)
}

def Hosts() {
    if ("${BRANCH_NAME}" =~ /^v[0-9]*/) {
        return ['跳过部署', 'alpha', 'prod', 'toutiao']
    }
    return ['跳过部署', 'alpha', 'test']
}

def Actions() {
    return ['game', 'matchmaking', 'pvp', 'all']
}


pipeline {
    agent any
    // agent {
    //     node {
    //         label "workbench-go"
    //         customWorkspace "/go/src/ApeCrafts/battlecraft/"
    //     }
    // }

    parameters {
        choice(choices: Hosts(),   description: '部署到 alpha 或 prod?', name: 'host')
        choice(choices: Actions(), description: '哪组进程？', name: 'action')
    }

    environment {
        GOPATH="${env.WORKSPACE}" 
        // GOPATH="/go/"
        BUILD_DIR="${GOPATH}/src/ApeCrafts/battlecraft"
        CHANGELOGS=sh(script: "git log -3 | grep -e \"    .*\"", returnStdout: true)
    }

    stages {
        stage('Build Data') {
            when {
                expression { getBuildUser() != null }
            }

            steps {
                sh """
                make init
                make build
                printenv
                """
            }

            post {
                failure {
                    chatFail("params=${params}", "Build Data Failed!!!")
                }

                success {
                    chatOK("params=${params}", "Build Data OK !")
                }
            }
        }

        stage('Pre Work') {
            when {
                expression { getBuildUser() != null }
            }

            steps {
                sh """
                rm -rf          ${env.BUILD_DIR}
                mkdir -p        ${env.BUILD_DIR}
                cp -a ./server/ ${env.BUILD_DIR}/
                cp ./env        ${env.BUILD_DIR}/

                cd ${env.BUILD_DIR}/server/
                """
            }
        }
        
        // stage('Test') {
        //     steps {
        //         sh """
        //         cd ${env.BUILD_DIR}/server/
        //         make test
        //         make show
        //         """
        //     }

        //     post {
        //         failure {
        //             chatFail("host=${params}", "Test Failed!!!")
        //         }

        //         success {
        //             chatOK("host=${params}", "Test OK !")
        //         }
        //     }
        // }

        stage('Deploy') {
            when { 
                expression { ['alpha', 'prod'].contains(params.host) }
            }

            stages {
                stage('Push Data') {
                    steps {
                        sh """
                        make push-data host=${params.host}
                        """
                    }
                }

                stage('GameServer') {
                    when {
                        expression { ["all", "game"].contains(params.action) }
                    }

                    steps {
                        sh """
                        cd ${env.BUILD_DIR}/server/
                        make deploy-game    host=${params.host}
                        """
                    }
                }
 
                stage('MatchMakingServer') {
                    when {
                        expression { ["all", "matchmaking"].contains(params.action) }
                    }

                    steps {
                        sh """
                        cd ${env.BUILD_DIR}/server/
                        make deploy-matchmaking    host=${params.host}
                        """
                    }
                }

                stage('PVP Server') {
                    when {
                        expression { ["all", "pvp"].contains(params.action) }
                    }

                    steps {
                        sh """
                        cd ${env.BUILD_DIR}/server/
                        make deploy-pvp    host=${params.host}
                        """
                    }
                }
 
            }

            post {
                failure {
                    chatFail("params=${params}", "Deploy Fail !!!\n ${env.CHANGELOGS}")
                }

                success {
                    chatOK("params=${params}", "Deploy OK !\n${env.CHANGELOGS}")
                }
            }
        }
    }
}
