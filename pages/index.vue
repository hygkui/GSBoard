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

            <input type="text" placeholder="input tip text" v-model="tipText">
            <button @click="setTip">发布公告</button>
            <br>

            <button @click="setQuestion('q1')">设置题目1</button>
            <button @click="startStopTime(10)">开始倒计时10s</button>
            <button @click="showAnswerAndRightChoice('q1')">显示答案与答题统计</button>

            <br>

            <button @click="setQuestion('q2')">设置题目2</button>
            <button @click="startStopTime(10)">开始倒计时10s</button>
            <button @click="showAnswerAndRightChoice('q2')">显示答案与答题统计</button>


            <br>

            <button @click="setQuestion('q3')">设置题目3</button>
            <button @click="startStopTime(10)">开始倒计时10s</button>
            <button @click="showAnswerAndRightChoice('q3')">显示答案与答题统计</button>

            <br>

            <button @click="setQuestion('q4')">设置题目4</button>
            <button @click="startStopTime(10)">开始倒计时10s</button>
            <button @click="showAnswerAndRightChoice('q4')">显示答案与答题统计</button>

            <br>

            <button @click="setQuestion('q5')">设置题目5</button>
            <button @click="startStopTime(10)">开始倒计时10s</button>
            <button @click="showAnswerAndRightChoice('q5')">显示答案与答题统计</button>

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
          board: null
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
        font-size: 18pt;
        margin: 0px;
        padding: 10px;
        border-radius: 5px;
    }
    button {
        font-size: 18pt;
        margin: 5px;
        padding: 10px;
        background:rgb(234, 234, 241);
        border-radius: 5px;
        border: 1px solid white;
    }
</style>
