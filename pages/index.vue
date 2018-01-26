<template>
    <section class="container">
        <img src="~assets/img/logo.png" style="height: 60px; width: 60px;" alt="Nuxt.js Logo" class="logo" />
        <br>
        <span>TimeLine for The Game</span>
        <h1 class="title">
            我的游戏，我来主宰
        </h1>
        <div style="display: block;">
            <button @click="resetBoard()">重置游戏</button>

            <br>

            <div style="display:block; margin: 10px; border: 1px solid green; width: 100%; clear: both;">
              类型：{{ question.isMultipleChoice ? '多选' : '单选'}} 
              <button @click="question.isMultipleChoice = !question.isMultipleChoice">切换类型</button>
              <br>
              title<input type="text" placeholder="input question text" v-model="question.title">
              <br>
              answer<input type="text" placeholder="input question text" v-model="question.answer">
               <br>
              <input type="text" placeholder="input question choice" v-model="tempChoice"  v-on:keyup.enter="addChoice">
              <button @click="addChoice">Add choice</button>

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

            <input type="text" placeholder="input tip text" v-model="tipText">
            <button @click="setTip">发布公告</button>
            <br>

            <button @click="setQuestion('-L3kqmVCNJesCBlA8yXK')">设置题目1</button>
            <button @click="startStopTime(10)">开始倒计时10s</button>
            <button @click="showAnalysis('true')">显示答案与答题统计</button>

            <br>

            <button @click="setQuestion('-L3kqzToY7r2oyv9V1QT')">设置题目2</button>
            <button @click="startStopTime(10)">开始倒计时10s</button>
            <button @click="showAnalysis('true')">显示答案与答题统计</button>


            <br>

            <button @click="setQuestion('-L3kr8d81ZWv5gaKcZKl')">设置题目3</button>
            <button @click="startStopTime(10)">开始倒计时10s</button>
            <button @click="showAnalysis('true')">显示答案与答题统计</button>

            <br>

            <button @click="setQuestion('-L3krL74X7MXNpEp8vjU')">设置题目4</button>
            <button @click="startStopTime(10)">开始倒计时10s</button>
            <button @click="showAnalysis('true')">显示答案与答题统计</button>

            <br>

            <button @click="setQuestion('-L3kr_OmQm2J8UxvbjV4')">设置题目5</button>
            <button @click="startStopTime(10)">开始倒计时10s</button>
            <button @click="showAnalysis('true')">显示答案与答题统计</button>
            <br>

            <button @click="setQuestion('-L3kt_0rDSuap8G6EQsv')">设置题目6</button>
            <button @click="startStopTime(10)">开始倒计时10s</button>
            <button @click="showAnalysis('true')">显示答案与答题统计</button>
            <br>

            <button @click="endGame()">打扫战场</button>
        </div>


        <div style="background-color: gray;">
            {{ board }}
        </div>
    </section>
</template>

<script>
    import axios from '~/plugins/axios'
    import Wilddog from 'wilddog'

    let boardRef = Wilddog.initializeApp({ syncURL: 'https://kuafu.wilddogio.com/' }).sync().ref('/board')

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
          rightChoices: []
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
        async showAnswerAndRightChoice (questionId) {
          console.log('showAnswerAndRightChoice:', questionId)
          await axios.post('/api/showAnswerAndRightChoice', {
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
