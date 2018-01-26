import { Router } from 'express'
import * as wilddog from 'wilddog'
import { setInterval } from 'timers'
const router = Router()

var config = {
  syncURL: 'https://kuafu.wilddogio.com' // 输入节点 URL
}
wilddog.initializeApp(config)
var rootRef = wilddog.sync().ref()
var wdRefs = {
  board: rootRef.child('board'),
  project: rootRef.child('project'),
  users: rootRef.child('users'),
  timeline: rootRef.child('timeline')
}

let boardInstance
wdRefs.board.on('value', function (snapshot) {
  boardInstance = snapshot.val()
})

/** check answer. 
  POST {questionId, choice}
*/
router.post('/checkAnswer', function (req, res, next) {
  let { questionId, choice, userId } = req.body
  // var isChoiceRight = false
  let question
  wdRefs.project.child(questionId).once('value').then(function (snapshot) {
    console.info(snapshot.val())
    question = snapshot.val()
    if (question.rightChoice.toString() === choice.toString()) {
      // if right
      wdRefs.users.child(userId).update({ // die but ask recovery
        submitAnswerState: 1
      })
    } else {
      // if wrong
      wdRefs.users.child(userId).once('value').then(function (snapshot) {
        let user = snapshot.val()
        if (user.recoveryCards && user.recoveryCards.length > 0) {
          wdRefs.users.child(userId).update({ // die but ask recovery
            isAlive: false,
            actionAskRecovery: true,
            submitAnswerState: 1
          })
        } else { // die 
          wdRefs.users.child(userId).update({
            isAlive: false,
            actionAskRecovery: false,
            submitAnswerState: 1
          })
        }
      }).catch(console.error)

      // update board
      let board = boardInstance
      let userIds = board.userIds
      if (userIds === undefined) {
        userIds = []
      }
      if (userIds.indexOf(userId) !== -1) {
        userIds.splice(userIds.indexOf(userId), 1)
      }

      wdRefs.board.update({
        userIds,
        aliveCount: userIds.length
      })
    }
    // show answer, update aliveCount and analysis
    let board = boardInstance
    let analysis = board.analysis
    if (!question.isMultipleChoice) {
      if (analysis[choice].count === undefined) {
        analysis[choice].count = 0
      }
      analysis[choice].count++
    } else { // radio choice
      // not finished. for multiple choice
    }
    console.log({
      analysis: analysis
    })
    wdRefs.board.update({
      analysis: analysis
    })
  })
  res.json({
    code: 'success'
  })
})

/** recovery user
 * POST { userId, code}
 */
router.post('/recovery', function (req, res) {
  console.log('enter post /recovery')
  let { userId, code } = req.body
  wdRefs.users.child(userId).once('value').then(function (snapshot) {
    let user = snapshot.val()
    // remove ask recovery action, set user die
    if (code === 'yes' && user.recoveryCards &&
      user.recoveryCards.length > 0 &&
      !user.hasRecovery && !user.isAlive) {
      let recoveryCards = user.recoveryCards
      let usedCards = user.usedCards
      if (user.usedCards === undefined) {
        usedCards = []
      }

      usedCards.push(recoveryCards[0])
      recoveryCards.splice(0, 1)

      // do recovery
      wdRefs.users.child(userId).update({
        isAlive: true,
        actionAskRecovery: false,
        hasRecovery: true,
        usedCards,
        recoveryCards
      })

      let board = boardInstance
      let userIds = board.userIds
      if (userIds === undefined) {
        userIds = []
      }
      if (userIds.indexOf(userId) === -1) {
        userIds.push(userId)
      }

      wdRefs.board.update({
        userIds,
        aliveCount: userIds.length
      })

      // update board
    } else if (code === 'no' && user.actionAskRecovery) { // just die
      console.log('just die')
      wdRefs.users.child(userId).update({
        actionAskRecovery: false
      })
    }
  }).catch(console.error)
  res.json({
    code: 'success'
  })
})

/** reset to start the game
 * POST {userId}
 */
router.post('/enterGame', function (req, res) {
  let ts = new Date()
  console.log(req.query, req.body)
  let userId = req.body.userId
  console.log('enterGame', ts, userId)
  let userRef = wdRefs.users.child(userId)
  wdRefs.users.child(userId).once('value').then(function (snapshot) {
    let user = snapshot.val()
    let board = boardInstance
    console.log(user)

    console.log(board.startTime, new Date(board.startTime), ts, new Date(board.startTime) > ts)
    if (new Date(board.startTime) > ts) {
      userRef.update({ // reset user
        actionAskRecovery: false,
        actionAskQuest: false,
        isAlive: true,
        hasRecovery: false,
        gotTokens: 0,
        submitAnswerState: -1
      })
      let userIds = board.userIds
      if (userIds === undefined) {
        userIds = []
      }
      if (userIds.indexOf(userId) === -1) {
        userIds.push(userId)
      }
      wdRefs.board.update({
        userIds,
        aliveCount: userIds.length
      })
    } else {
      // do nothing
      console.error('game already started')
    }
  }).catch(console.error)
  res.json({
    code: 'success'
  })
})

router.post('/exitGame', (req, res) => {
  let userId = req.body.userId
  let userIds = boardInstance.userIds
  if (userIds.indexOf(userId) !== -1) {
    userIds.splice(userIds.indexOf(userId), 1)
  }
  wdRefs.board.update({
    aliveCount: userIds.length,
    userIds
  })
  res.json({
    code: 'success'
  })
})

/** create question
 * POST {question} 
 */
router.post('/pushQuestion', function (req, res) {
  console.log('pushQuestion')
  let { questionData } = req.body
  console.log('questionData', questionData)
  wdRefs.project.push(questionData, console.log)
  res.json({
    code: 'success'
  })
})

/**
 * POST reset board
 */
router.post('/resetBoard', function (req, res) {
  let boardData = req.body.boardData
  if (!boardData) {
    boardData = {
      aliveCount: 0,
      analysis: null,
      answer: '',
      rightChoice: '',
      startTime: new Date().toJSON(),
      userIds: {},
      tip: 'A new Game',
      question: null,
      rightAnswer: '',
      hasEnd: false,
      showAnalysis: false,
      totalRewardTokens: 10000
    }
  } else {
    boardData.startTime = new Date(boardData.startTime).toJSON()
  }
  console.log('resetBoard', boardData)
  wdRefs.board.set(boardData)
  res.json({
    code: 'success'
  })
})

/** set Tip
 * POST { text: xxx}
 */
router.post('/setTip', function (req, res) {
  let text = req.body.text
  wdRefs.board.update({
    tip: text
  })
  res.json({
    code: 'success'
  })
})

router.post('/startStopTime', function (req, res) {
  let ms = parseInt(req.body.seconds, 10) * 1000
  let step = 200
  let stoper = setInterval(function () {
    let second = parseInt(ms / 1000, 10)
    wdRefs.board.update({
      stopTime: second
    })
    ms -= step
    if (ms < 0) {
      clearInterval(stoper)
    }
  }, step)
  // set all the alive users's state hasSubmitAnswer to 0
  let userIds = boardInstance.userIds
  userIds.map(function (userId) {
    wdRefs.users.child(userId).update({
      submitAnswerState: 0
    })
  })
  res.json({
    code: 'success'
  })
})

/** set game board question
 * POST { questionId }
 */
router.post('/setQuestion', (req, res) => {
  let questionId = req.body.questionId
  // get qId ref
  wdRefs.project.child(questionId).once('value').then(function (snapchat) {
    let question = snapchat.val()
    wdRefs.board.update({
      question: {
        title: question.title,
        choices: question.choices,
        questionId,
        isMultipleChoice: question.isMultipleChoice
      },
      rightChoice: question.rightChoice,
      answer: question.answer,
      showAnalysis: false,
      analysis: question.choices
    })
  })
  res.json({
    code: 'success'
  })
})

router.post('/endGame', (req, res) => {
  // 如下用户获得奖励！！！
  wdRefs.board.update({
    hasEnd: true,
    analysis: null,
    answer: '',
    rightChoice: '',
    tip: 'End of Game',
    question: null,
    rightAnswer: '',
    showAnalysis: false
  })

  let totalRewardTokens = parseInt(boardInstance.totalRewardTokens, 10)
  let usersCount = boardInstance.userIds.length
  let gotTokens = parseInt(totalRewardTokens / usersCount, 10)
  boardInstance.userIds.map((userId, key) => {
    // 每个userid 更新其金币值
    wdRefs.users.child(userId).update({
      gotTokens
    })
  })
})

router.post('/showAnalysis', (req, res) => {
  let option = false
  if (req.body.option && req.body.option === 'true') {
    option = true
  }
  wdRefs.board.update({
    showAnalysis: option
  })
  res.send({
    code: 'success'
  })
})

export default router
