<template>
    <section class="container">
        <img src="~assets/img/logo.png" style="height: 60px; width: 60px;" alt="Nuxt.js Logo" class="logo" />
        <br>
        <span>TimeLine for The Game</span>
        <h2 class="title">
            冲顶游戏控制台
        </h2>
        <div style="display: block;">
            <button @click="resetBoard()">重置游戏</button>

            <br>

            

            <input type="text" placeholder="input tip text" v-model="tipText">
            <button @click="setTip">发布公告</button>
            <br>

            <div style="background-color: gray; text-align: left;">
              <ul>
                <li v-for="(q, index) in questions" :key="q.title">{{ q.title }} 
                  <button @click="add2SelectedQuestions(index)">添加到备选题目中</button>
                </li>
              </ul>
            </div>

            <div style="background-color: yellow; text-align: left;">
              <p>共{{ selectedQuestions.length }}道题目</p>
              <ul>
                <li v-for="(sq, index) in selectedQuestions">
                第{{ index+1 }}道题目:
                {{ sq.title }}
                <button @click="removeFromSelectedQuestions(index)">从备选题目中删除</button>
                </li>
              </ul>
            </div>

            
            <button v-for="(sq, index) in selectedQuestions" @click="exeSetSelectedQeustion(sq.id)">
              执行题目{{ index + 1 }}
            </button>
            
            <button @click="endGame()">打扫战场</button>
        </div>

        <div style="display:block; margin: 10px; border: 1px solid green; width: 100%; clear: both;">
          类型：{{ question.isMultipleChoice ? '多选' : '单选'}} 
          <button @click="question.isMultipleChoice = !question.isMultipleChoice">切换类型</button>
          <br>
          选择题题目内容：<input type="text" placeholder="" v-model="question.title">
          <br>
          答案解析：<input type="text" placeholder="" v-model="question.answer">
            <br>
          <input type="text" placeholder="选项内容" v-model="tempChoice"  v-on:keyup.enter="addChoice">
          <button @click="addChoice">增加选项</button>

          <ul style="display: inline;">
            <li v-for="(choice, index) in question.choices" :key="index">
              <span v-if="choice.isRight">【✔️】</span>
              {{ choice.text }} 
              <button @click="question.choices.splice(index, 1)">X</button>
              <button @click="toggleRightChoice(index)">{{ choice.isRight ? '取消正确答案标记' : '标记为正确答案' }}</button>
            </li>
          </ul>
          <br>

          <p style="color: red;">
            {{ question }}
          </p>
          <button @click="pushQuestion">添加题目到题库</button>
        </div>

        <div style="background-color: gray;">
            {{ board }}
        </div>
    </section>
</template>

<script>
    import axios from '~/plugins/axios'
    import Wilddog from 'wilddog'

    let rootWDRef = Wilddog.initializeApp({ syncURL: 'https://kuafu.wilddogio.com/' }).sync()
    let boardRef = rootWDRef.ref('/board')
    let questionsRef = rootWDRef.ref('/project')

    export default {
      async asyncData () {
        let { data } = await axios.get('/api/users')
        return { users: data }
      },
      head () {
        return {
          title: 'Users'
        }
      },
      data () {
        return {
          tipText: '',
          isStopTimeStart: false,
          board: null,
          question: {
            title: '',
            choices: [],
            rightChoice: '',
            answer: '',
            isMultipleChoice: false
          },
          tempChoice: '',
          rightChoices: [],
          questions: [],
          selectedQuestions: []
        }
      },
      methods: {
        async setTip () {
          if (this.tipText.length > 0) {
            await axios.post('/api/setTip', {
              text: this.tipText
            })
            this.tipText = ''
          }
        },
        add2SelectedQuestions (index) {
          this.selectedQuestions.push(this.questions[index])
        },
        removeFromSelectedQuestions (index) {
          this.selectedQuestions.splice(index, 1)
        },
        addChoice () {
          this.question.choices.push({
            text: this.tempChoice,
            isRight: false,
            count: 0
          })
          this.tempChoice = ''
        },
        toggleRightChoice (index) {
          this.question.choices[index].isRight = !this.question.choices[index].isRight
        },
        async pushQuestion () {
          this.question.choices.forEach((choice, index) => {
            if (choice.isRight) {
              this.rightChoices.push(index)
            }
          })
          if (this.rightChoices.length < 1) {
            alert('至少有一个答案')
          } else if (!this.question.isMultipleChoice && this.rightChoices.length !== 1) {
            alert('单选题有且只有一个答案')
          } else {
            this.question.rightChoice = this.rightChoices.join(',')
            await axios.post('/api/pushQuestion', {
              questionData: this.question
            })
            this.resetQuestion()
          }
        },
        async exeSetSelectedQeustion (id) {
          this.setQuestion(id)
          this.startStopTime(15)
          let that = this
          setTimeout(() => {
            that.showAnalysis('true')
          }, 15 * 1000)
        },
        resetQuestion () {
          this.question = {
            title: '',
            choices: [],
            rightChoice: '',
            answer: '',
            isMultipleChoice: false
          }
          this.rightChoices = []
          this.tempChoice = ''
        },
        async startStopTime (seconds) {
          if (!this.isStopTimeStart) {
            this.isStopTimeStart = true
            await axios.post('/api/startStopTime', {
              seconds
            })
            let that = this
            setTimeout(() => {
              that.isStopTimeStart = false
            }, seconds * 1000)
          } else {
            alert('in a time stop, try later')
          }
        },
        async resetBoard () {
          await axios.post('/api/resetBoard')
          await axios.post('/api/enterGame', {
            userId: 'xinnix'
          })
          await axios.post('/api/enterGame', {
            userId: 'zzh'
          })
        },
        async setQuestion (questionId) {
          console.log('set question with id' + questionId)
          await axios.post('/api/setQuestion', {
            questionId
          })
        },
        async showAnalysis (option) {
          await axios.post('/api/showAnalysis', {
            option
          })
        },
        async endGame () {
          console.log('end game')
          await axios.post('/api/endGame')
        }
      },
      mounted () {
        let that = this
        boardRef.on('value', function (snapshot) {
          that.board = snapshot.val()
        })
        questionsRef.on('value', function (snapshot) {
          that.questions = []
          snapshot.forEach(function (snap) {
            let question = snap.val()
            question.id = snap.key()
            that.questions.push(question)
          })
        })
      }
    }
</script>

<style scoped>
    .title
    {
        margin: 30px 0;
    }
    .users
    {
        list-style: none;
        margin: 0;
        padding: 0;
    }
    .user
    {
        margin: 10px 0;
    }

    input {
        font-size: 12pt;
        margin: 0px;
        padding: 5px;
        border-radius: 5px;
    }
    button {
        font-size: 12pt;
        margin: 5px;
        padding: 5px;
        background:rgb(234, 234, 241);
        border-radius: 5px;
        border: 1px solid white;
    }
</style>
