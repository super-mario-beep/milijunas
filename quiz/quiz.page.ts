import { Component, OnInit } from '@angular/core';
import { NativeAudio } from '@ionic-native/native-audio/ngx';
import { Storage } from '@ionic/storage';
import { userData } from '../userData';
import { soundEditor } from '../soundEditor';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Platform, PopoverController, IonicModule } from '@ionic/angular';
import { AdMobFree, AdMobFreeBannerConfig,AdMobFreeInterstitial,AdMobFreeInterstitialConfig, AdMobFreeRewardVideoConfig } from '@ionic-native/admob-free/ngx';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.page.html',
  styleUrls: ['./quiz.page.scss'],
})
export class QuizPage implements OnInit {
  question = ""
  answerA = ""
  answerB = ""
  answerC = ""
  answerD = ""
  correctAnswer = 0
  answerSelected = false;
  answerNumberSelected = -1;//-1 not selected
  currentQuestionNumber = 1//1-15
  currentQuestionId = 0;
  availableAnswers = [0,1,2,3]
  clickingAvailable = false;
  loadingTotalTime = 0;
  questionJSON;
  jokers = [true,true,true]
  currentWonMoneyOnLose = 0;
  currentWonMoneyOnLoseString = ""
  osiguranText = "OSIGURAN IZNOS"
  iznos = [0,100,200,300,500,1000,2000,4000,8000,16000,32000,64000,125000,250000,500000,1000000]
  secondLeave = false;
  videoCanShow = false;
  rewardUsed = false;
  soundOn:boolean = true;
  lang:string = "cro";

  constructor(
    public audio: NativeAudio,//sound drukcija putanja!!!!!!!!!!!!!!
    public storage: Storage,
    private userData: userData,
    private soundEditor:soundEditor,
    private alert: AlertController,
    private router: Router,
    public toastController: ToastController,
    private platform: Platform,
    private admobFree: AdMobFree
    ) {
    soundEditor.setupSound(audio);
    this.storage.get("soundOn").then((record)=>{
      console.log("load sound", record)
      if(record == "off"){
          this.soundOn = false;
          soundEditor.stopAllSounds()
          soundEditor.setMuteMode()
      }else{
        this.soundOn = true;
        soundEditor.setUnMuteMode();
      }
  })
    this.storage.get("lang").then((res) =>{
      if(res == "ger"){
        this.lang = "ger"
        this.osiguranText = "VERSICHERTER BETRAG"
        document.getElementById("fullHelp").style.backgroundImage = "url('../../assets/New_folder/ger/extra_hd_logo.jpg')"
        document.getElementById("questionsListID").style.backgroundImage = "url('../../assets/New_folder/ger/1.png')"
        document.getElementById("body_").style.backgroundImage = "url('../../assets/New_folder/ger/extra_hd_logo.jpg')"
        document.getElementById("my_img").style.display = "none" 
      }else{
        this.lang = "cro"
      }
      this.setupQuestion();
    }) 
    
    this.allLoaded()
    this.prepareVideo()
    console.log(this.quiz)
    
    

    /*userData.clearAllRecords()
    for(var i = 0; i < 5;i++){
      userData.clearQuestionsSet(i)
    }*/
    //console.log(this.quiz[1])
    /*
    for(var q = 1;q<=5;q++){
      for(var i = 0; i < this.quiz[q].questions.length;i++){
        if(this.quiz[q].questions[i].question.length > 87){
          //console.log(this.quiz[q].questions[i].question)
        }
        for(var j = 0; j < 4;j++){
          if(this.quiz[q].questions[i].offered[j].length >= 21){
           // console.log(this.quiz[q].questions[i].offered[j])
          }
        }
      }
    }*/
    this.platform.backButton.subscribe(()=>{
      if(this.router.url != "/quiz")
        return
      if(this.secondLeave)
        return
      this.secondLeave = true;
      setTimeout(() => {
        this.secondLeave = false;
      }, 1000);
      this.userData.setRecordSum(this.iznos[this.currentQuestionNumber-1])
      this.quitGame()
    })
    try{
      var menu = document.getElementById("mainBox")
      menu.style.opacity = "1"
    }catch{
      //
    }

  }

  isGermanAnswer(json_array){
    if(json_array[0] == "..." || json_array[1] == "..." || json_array[2] == "..." ){
      return false;
    }
    return true;
  }

  prepareVideo(){
    setTimeout(() => {
      const adConfig: AdMobFreeRewardVideoConfig = {
        id:"ca-app-pub-9933506788213398/8961647106",
      }
      this.admobFree.rewardVideo.config(adConfig);
      this.admobFree.rewardVideo.prepare().then(() => {
        document.addEventListener('admob.rewardvideo.events.LOAD', (reslut) =>{
          this.videoCanShow = true;
        })
      }).catch((e) =>{
        setTimeout(() => {
          this.prepareVideo()
        }, 2000);
      })  
    }, 500);


  }

  showAd(){    
    this.admobFree.rewardVideo.show() 
    this.videoCanShow = false;
    this.rewardUsed = true;
    document.addEventListener('admob.rewardvideo.events.REWARD', (result) => {
      //this.prepareVideo();
      this.alert.dismiss();
      this.currentQuestionNumber--;
      this.prepareQuestionAnimations()
    });
  }

  async askForContinue(){
    if(!this.videoCanShow)
      return
    if(this.rewardUsed)
      return

    var _text_ = "Nikad nije kasno za osvojiti milijun. Pogledaj reklamu i nastavi na trenutnom pitanju?"
    if(this.lang == "ger"){
      _text_ = "Nie ist es zu spat Million zu gewinnen. Schau dir die Werbung und geh fort mit der jetztiger Frage?"
    }

    var __t_ = "Nije kraj"
    if(this.lang == "ger"){
      __t_ = "Es ist nicht zu Ende"
    }

    var nehvala = "Ne, hvala"
    if(this.lang == "ger"){
      nehvala = "Nein, Danke"
    }

    var da = "Da"
    if(this.lang == "ger"){
      da = "Ja"
    }
    const alert = await this.alert.create({
      header: __t_,
      cssClass: 'my-css',
      message: _text_,
      buttons: [
        {
          text: nehvala,
          role: 'cancel',
          handler: (blah) => {
            
          }
        }, {
          text: da,
          handler: () => {
            this.showAd()
          }
        }
      ]
    });

    await alert.present();
  }



  
  async quitGame(){
    var da = "Vaš trenutni iznos dodan je u rezultate."
    if(this.lang == "ger"){
      da = "Ihr aktueller Betrag wurde dem Ergebnis hinzugefügt"
    }
    const alert = await this.alert.create({
      header: "",
      cssClass: 'my-css',
      message: da,
      buttons: [
        {
          text: 'Ok',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
            console.log('Confirm Cancel: blah');
          }
        }
      ]
    });

    await alert.present();
  }

  async toastAllQuestionsUsed() {
    var da = "Sva pitanja su prikazana. Pitanja će biti prikazana ponovo ispočetka"
    if(this.lang == "ger"){
      da = "Alle Fragen sind angezeigt.Die Fragen werden wieder angezeigt"
    }
    const toast = await this.toastController.create({
      message: da,
      duration: 5000
    });
    toast.present();
  }


  async useJoker(type:number){
    if(this.jokers[type-1] === false){
      return
    }
    var joker = ""
    if(type === 1){
      joker = "pitaj publiku"
      if(this.lang == "ger"){
        joker = "frage das Publikum"
      }
    }else if(type === 2){
      joker = "pola-pola"
      if(this.lang == "ger"){
        joker = "Halbe - Halbe"
      }
    }else{
      joker = "zovi"
      if(this.lang == "ger"){
        joker = "rufe"
      }
    }

    var js = "Jeste li sigurni da želite iskoristiti džokera " + joker + "?"
    if(this.lang == "ger"){
      js = "Sind Sie sicher das sie den Joker nutzen wollen " + joker + "?"
    }

    var no = "Ne"
    if(this.lang == "ger"){
      no = "Nein"
    }

    var da = "Da"
    if(this.lang == "ger"){
      da = "Ja"
    }
    const alert = await this.alert.create({
      header: "",
      cssClass: 'my-css',
      message: js,
      buttons: [
        {
          text: no,
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
            console.log('Confirm Cancel: blah');
            this.hideFullhelp()
          }
        }, {
          text: da,
          handler: () => {
            if(type === 1){
              this.jokerAskPublic()
            }else if(type === 2){
              this.jokerHalfHalf()
            }else{
              this.jokerAskFriend()
            }
            this.hideFullhelp()
          }
        }
      ]
    });

    await alert.present();
  }

  resetAll(){
    document.getElementById("answerA").style.backgroundImage = "url('../../assets/small_quest.png')"
    document.getElementById("answerB").style.backgroundImage = "url('../../assets/small_quest.png')"
    document.getElementById("answerC").style.backgroundImage = "url('../../assets/small_quest.png')"
    document.getElementById("answerD").style.backgroundImage = "url('../../assets/small_quest.png')"
    document.getElementById("fifi-X").style.display = "none"
    document.getElementById("call-X").style.display = "none"
    document.getElementById("public-X").style.display = "none"
    document.getElementById("answerA_pTag").style.opacity = "1"
    document.getElementById("answerB_pTag").style.opacity = "1"
    document.getElementById("answerC_pTag").style.opacity = "1"
    document.getElementById("answerD_pTag").style.opacity = "1"
    document.getElementById("mainQuizBox").style.bottom = "0px"
    document.getElementById("questionsListID").style.backgroundImage = "url('../../assets/New_folder/1.png')"
    if(this.lang == "ger"){
      document.getElementById("questionsListID").style.backgroundImage = "url('../../assets/New_folder/ger/1.png')"
    }


    this.osiguranText = "OSIGURAN IZNOS"
    if(this.lang == "ger"){
      this.osiguranText = "VERSICHERTER BETRAG"
    }

    this.soundEditor.stopAllSounds()
    this.soundEditor.playSound(5,true)
    
    this.question = ""
    this.answerA = ""
    this.answerB = ""
    this.answerC = ""
    this.answerD = ""
    this.correctAnswer = 0
    this.answerSelected = false;
    this.answerNumberSelected = -1;//-1 not selected
    this.currentQuestionNumber = 1//1-15
    this.currentQuestionId = 0;
    this.availableAnswers = [0,1,2,3]
    this.clickingAvailable = false;
    this.loadingTotalTime = 0;
    this.jokers = [true,true,true]
    this.currentWonMoneyOnLose = 0;
    this.currentWonMoneyOnLoseString = ""
    this.rewardUsed = false;
    this.setupQuestion()
    this.prepareVideo()
  }

  async callFriend(odgovor:string,siguran:number){
    this.clickingAvailable = false;
    this.soundEditor.stopAllSounds();
    this.soundEditor.playSound(9,false)
    var box = document.getElementById("jokerAskPublicBoxID")
    box.style.left = "2%"
    document.getElementById("1_joker").innerText = "Vi: E bok, tu sam u milijunašu i treba mi tvoja pomoć"
    if(this.lang == "ger"){
      document.getElementById("1_joker").innerText = "Du: Hallo, ich bin hier beim Millionar und brauche deine Hilfe"
    }

    setTimeout(() => {
      document.getElementById("2_joker").innerText = "Prijatelj: Bok, reci?"
      if(this.lang == "ger"){
        document.getElementById("2_joker").innerText = "Freund: Hallo, sage"
      }
    }, 2500);
    setTimeout(()=>{
      document.getElementById("3_joker").innerText =  "Vi: Slušaj pitanje"
      if(this.lang == "ger"){
        document.getElementById("3_joker").innerText =  "Du: Horen Sie sich die Frage an"
      }
      box.scrollTop = box.scrollHeight;
    },4500)
    setTimeout(() => {
      document.getElementById("4_joker").innerText =  this.question + ""
      if(document.getElementById("answerA_pTag").style.opacity !== "0"){
        document.getElementById("5_joker").innerText = "A: " + this.answerA
      }
      if(document.getElementById("answerB_pTag").style.opacity !== "0"){
        document.getElementById("6_joker").innerText = "B: " + this.answerB
      }
      if(document.getElementById("answerC_pTag").style.opacity !== "0"){
        document.getElementById("7_joker").innerText = "C: " + this.answerC
      }
      if(document.getElementById("answerD_pTag").style.opacity !== "0"){
        document.getElementById("8_joker").innerText = "D: " + this.answerD
      }
      box.scrollTop = box.scrollHeight;

    }, 5700);
    setTimeout(() => {
      document.getElementById("9_joker").innerText = "Prijatelj: Hmm"
      if(this.lang == "ger"){
        document.getElementById("9_joker").innerText = "Freund: Hmm"
      }
      document.getElementById("10_joker").innerText = " " + odgovor
      box.scrollTop = box.scrollHeight;
      if(siguran === -1){
        setTimeout(() => {
          document.getElementById("11_joker").innerText = "Vi: Hvala, bok"
          if(this.lang == "ger"){
            document.getElementById("11_joker").innerText = "Du: Danke, tchüss"
          }
          box.scrollTop = box.scrollHeight;
        }, 14001);
      }
    }, 10000);

    setTimeout(() => {
      document.getElementById("12_joker").innerText = "Vi: Kolko posto si siguran?"
      if(this.lang == "ger"){
        document.getElementById("12_joker").innerText = "Du: Wie viel Prozent bist du dir sicher"
      }
      box.scrollTop = box.scrollHeight;

    }, 14000);

    setTimeout(() => {
      document.getElementById("13_joker").innerText = "Prijatelj: " + siguran +"%"
      if(this.lang == "ger"){
        document.getElementById("13_joker").innerText = "Freund: " + siguran + "%"
      }
      box.scrollTop = box.scrollHeight;

    }, 17000);

    setTimeout(() => {
      document.getElementById("14_joker").innerText = "Vi: Hvala, bok"
      if(this.lang == "ger"){
        document.getElementById("14_joker").innerText = "Du: Danke, tchüss"
      }
      box.scrollTop = box.scrollHeight;
    }, 19000);

    setTimeout(() => {
      this.clickingAvailable = true;
      box.style.left = "-100%"
      box.scrollTop = box.scrollHeight;
      setTimeout(() => {
        this.soundEditor.stopAllSounds()
        if(this.currentQuestionNumber < 6)
          this.soundEditor.playSound(5,true)
        else
          this.soundEditor.playSound(7,true)
      }, 1000);
    }, 24000);

  }

  fullLoaded = false;
  showFullScreenAd(){
    const adConfig: AdMobFreeInterstitialConfig = {
      id:"ca-app-pub-9933506788213398/4521943251",//any
      autoShow: true
    }
    this.admobFree.interstitial.config(adConfig);
    this.admobFree.interstitial.prepare().then(() => {
    }) 
    document.addEventListener('admob.interstitial.events.LOAD', (reslut) =>{
      this.fullLoaded = true; 
      setTimeout(() => {
        this.fullLoaded = false; 
      }, 12000);
    })
    if(this.fullLoaded)
      return
  }

  async presentAlertConfirm(type:number) {
    var header = ""
    var message = ""
    if(type === 0){//pobjeda
      header = "Čestitamo"
      message = "Postali ste milijunaš! Vaš iznos je dodan u rekorde, ukupan osvojen iznos i poredak možete pogledati u Ljestvica. Nova igra?"
      if(this.lang == "ger"){
        header = "Herzlichen Gluckwünsch"
        message = "Sie sind Millionar geworden! Ihr Betrag wurde zu Datensätze hinzugefügt,auf ihren gewonnenen Gesamtbetrag und ihren Ranking können Sie auf der Skala einsehen. Neues Spiel ? "
      }
      this.showFullScreenAd()
    }else if(type === 1){//odustajanje
      header = "Čestitamo"
      message = "Vaš osvojeni iznos od " + "1000" + " kn je dodan u rekorde, ukupan osvojen iznos i poredak možete pogledati u Ljestvica. Nova igra?"
      if(this.lang == "ger"){
        header = "Herzlichen Gluckwünsch"
        message = "Ihr gewonnener Betrag ist 1000 € wurde zu Datensatzen hinzugefugt, auf ihren gewonnenen Gesamtbetrag und ihren Ranking konnen Sie auf der Skala einsehen. Neues Spiel ?"
      }
    }else if(type === 2){//krivi odgovor 
      header = "Kraj igre"
      message = "Nažalost niste uspjeli osvojiti milijun. Vaš osvojeni iznos od " + "1.000" + " kn je dodan u rekorde, ukupan osvojen iznos i poredak možete pogledati u Ljestvica. Nova igra?"
      if(this.lang == "ger"){
        header = "Ende des Spiel"
        message = "Leider haben Sie es nicht geschaft, 1 Million zu gewinnen. Ihr gewonnener Betragvon 1.000 € wurde zu Datensätzen hinzugefügt,auf ihren gewonnenen Gesamtbetrag und ihren Ranking können Sie auf der Skala einsehen. Neues Spiel ?"
      }
    }else{//krivi napocetku
      header = "Kraj igre"
      message = "Nažalost niste uspjeli osvojiti neki iznos. Nova igra?"
      if(this.lang == "ger"){
        header = "Ende des Spiel"
        message = "Leider haben Sie es nicht Geschaft einen Betrag zu gewinnen. Neues Spiel?"
      }
    }

    var _menu = "Povratak u menu"
    if(this.lang == "ger"){
      _menu = "Zurück zum Menu"
    }

    var _novo = "Nova igra"
    if(this.lang == "ger"){
      _novo = "Neues Spiel"
    }
    const alert = await this.alert.create({
      header: header,
      message: message,
      cssClass: 'my-css',
      buttons: [
        {
          text: _menu,
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
            console.log('Confirm Cancel: blah');
            this.router.navigate(['/home'])
          }
        }, {
          text: _novo,
          handler: () => {
            this.resetAll()
          }
        }
      ]
    });

    await alert.present();
  }

  allLoaded(){
    setTimeout(() => {
      this.loadingTotalTime +=200;
      if(this.loadingTotalTime > 5000){
        this.clickingAvailable = true;
        return;
      }
      if(this.soundEditor.checkAllSoundsLoaded()){
        this.clickingAvailable = true;
        return;
      }else{
        this.allLoaded()
      }
    }, 200);
  }

  ngOnInit() {
  }

  openFullHelp(){
    if(this.clickingAvailable === false)
      return
    document.getElementById("fullHelp").style.top = "0"
    console.log(document.getElementById("fullHelp").clientHeight)
    var item = document.getElementById("fullHelp").clientHeight
    document.getElementById("public-X").style.marginTop = (item-88)+"px"
    document.getElementById("fifi-X").style.marginTop = (item-88)+"px"
    document.getElementById("call-X").style.marginTop = (item-88)+"px"

  }

  hideFullhelp(){
    document.getElementById("fullHelp").style.top = "calc(-100%)"
    document.getElementById("public-X").style.marginTop = "0px"
    document.getElementById("fifi-X").style.marginTop = "0px"
    document.getElementById("call-X").style.marginTop = "0px"
  }

  setupQuestion(){
    setTimeout(() => {
      this.answerNumberSelected = -1
      this.answerSelected = false;
      var questionsArray;
      var questionArrayUsed;
      var type;
      var questionNumber;

      if(this.currentQuestionNumber == 7){
        this.showFullScreenAd()
      }

      if(this.currentQuestionNumber <= 5){
        questionsArray = this.quiz[1].questions
        questionArrayUsed = this.userData.getQuestionsUsed(0)
        type = 0
      }else if(this.currentQuestionNumber <= 8){
        questionsArray = this.quiz[2].questions
        questionArrayUsed = this.userData.getQuestionsUsed(1)
        type = 1
      }else if(this.currentQuestionNumber <= 11){
        questionsArray = this.quiz[3].questions
        questionArrayUsed = this.userData.getQuestionsUsed(2)
        type = 2
      }else if(this.currentQuestionNumber <= 13){
        questionsArray = this.quiz[4].questions
        questionArrayUsed = this.userData.getQuestionsUsed(3)
        type = 3
      }else{
        questionsArray = this.quiz[5].questions
        questionArrayUsed = this.userData.getQuestionsUsed(4)
        type = 4
      }

      var usedQuestions = questionArrayUsed
      var brojac = 0;
      var question;
      console.log(usedQuestions)
      while(1){
        if(brojac++ === 10){
          for(var j = 0;j < this.quiz[type+1].questions.length;j++){   
            if(!usedQuestions.includes(j)){
              question = this.quiz[type+1].questions[j]
              this.userData.setQuestionUsed(type,j)
              break;
            }
          }
          if(question === undefined){
            this.toastAllQuestionsUsed()
            this.userData.clearQuestionsSet(type)
            this.userData.setQuestionUsed(type,0)
            question = this.quiz[type+1].questions[0]
          }
          break;
        }
        var randomQuestion = this.getRandomInt(this.quiz[type+1].questions.length)//0 - 127 ( ako ih ima 128), ok
        if(!usedQuestions.includes(randomQuestion)){
          question = this.quiz[type+1].questions[randomQuestion]
          this.userData.setQuestionUsed(type,randomQuestion)
          break;
        }

      }
      console.log(question)
      /*
      var question 
      for(var i = questionArrayUsed.length; i <= questionsArray.length;i++){
        console.log(this.userData.getQuestionsUsed(type))
        if(i === questionsArray.length){
          this.toastAllQuestionsUsed()
          this.userData.clearQuestionsSet(type)
          this.userData.setQuestionUsed(type,0)
          question = this.quiz[type+1].questions[0]
          break;
        }else{
          question = this.quiz[type+1].questions[i]
          console.log(question)
          this.userData.setQuestionUsed(type,i)
          break;
        }
      }*/

      this.question = question.question;
      this.answerA = question.offered[0]
      this.answerB = question.offered[1]
      this.answerC = question.offered[2]
      this.answerD = question.offered[3]
      console.log(question.offered_ger)
      if(this.lang == "ger"){
        this.question = question.question_ger;
        if(this.isGermanAnswer(question.offered_ger)){
          this.answerA = question.offered_ger[0]
          this.answerB = question.offered_ger[1]
          this.answerC = question.offered_ger[2]
          this.answerD = question.offered_ger[3]
        }
      }
      
      document.getElementById("answerA_pTag").innerText = this.answerA
      document.getElementById("answerB_pTag").innerText = this.answerB
      document.getElementById("answerC_pTag").innerText = this.answerC
      document.getElementById("answerD_pTag").innerText = this.answerD


      var random = this.getRandomInt(2)
      if(random === 0){
        document.getElementById("answerA").style.float = "right"
      }else{
        document.getElementById("answerA").style.float = "left"
      }
      var random = this.getRandomInt(2)
      if(random === 0){
        document.getElementById("answerB").style.float = "right"
      }else{
        document.getElementById("answerB").style.float = "left"
      }
      var random = this.getRandomInt(2)
      if(random === 0){
        document.getElementById("answerC").style.float = "right"
      }else{
        document.getElementById("answerC").style.float = "left"
      }
      var random = this.getRandomInt(2)
      if(random === 0){
        document.getElementById("answerD").style.float = "right"
      }else{
        document.getElementById("answerD").style.float = "left"
      }
      /*
      setTimeout(() => {
        document.getElementById("answerA_pTag").innerText = question.offered[0]
        document.getElementById("answerB_pTag").innerText = question.offered[1]
        document.getElementById("answerC_pTag").innerText = question.offered[2]
        document.getElementById("answerD_pTag").innerText = question.offered[3]
      }, 1000);*/
      this.correctAnswer = question.answer
      this.currentQuestionId = questionNumber;
      this.availableAnswers = [0,1,2,3]
      this.questionJSON = question

      setTimeout(() => {
        this.clickingAvailable = true;
        console.log(document.getElementById("questionText_pTag").offsetHeight)//18,37,55
        var item = document.getElementById("questionText_pTag")
        item.style.marginTop = ((63 - item.offsetHeight)/2) + "px"
        document.getElementById("questionText_pTag").style.opacity = "1"

        if(document.getElementById("answerA_pTag").offsetHeight >= 28){
          document.getElementById("answerA").style.padding = "0 10px"
        }else{
          document.getElementById("answerA").style.padding = "10px"
        }

        if(document.getElementById("answerB_pTag").offsetHeight >= 28){
          document.getElementById("answerB").style.padding = "0 10px"
        }else{
          document.getElementById("answerB").style.padding = "10px"
        }

        if(document.getElementById("answerC_pTag").offsetHeight >= 28){
          document.getElementById("answerC").style.padding = "0 10px"
        }else{
          document.getElementById("answerC").style.padding = "10px"
        }
        if(document.getElementById("answerD_pTag").offsetHeight >= 28){
          document.getElementById("answerD").style.padding = "0 10px"
        }else{
          document.getElementById("answerD").style.padding = "10px"
        }

      }, 100);


    }, 100);
  }

  prepareQuestionAnimations(){
    this.currentQuestionNumber = this.currentQuestionNumber + 1;
    if(this.currentQuestionNumber != 16){
      document.getElementById("questionsListID").style.backgroundImage = "url('../../assets/New_folder/"+this.currentQuestionNumber+".png')"
      if(this.lang == "ger"){
        document.getElementById("questionsListID").style.backgroundImage = "url('../../assets/New_folder/ger/"+this.currentQuestionNumber+".png')"
      }
    }else if(this.currentQuestionNumber >= 17){
      return
    }
    var item = document.getElementById("mainQuizBox")
    var height = item.clientHeight
    item.style.bottom = "-" + height.toString() + "px"
    
    document.getElementById("info_money").style.top = "-180px"

    var timeout = 1600;

    if(this.currentQuestionNumber === 6 || this.currentQuestionNumber === 11){
      console.log(this.currentQuestionNumber)
      if(this.currentQuestionNumber === 6){
        this.currentWonMoneyOnLose = 1000
        this.currentWonMoneyOnLoseString = "1.000 kn"
        if(this.lang == "ger"){
          this.currentWonMoneyOnLoseString = "1.000 €"
        }
      }else if(this.currentQuestionNumber === 11){
        this.currentWonMoneyOnLose = 32000
        this.currentWonMoneyOnLoseString = "32.000"
        if(this.lang == "ger"){
          this.currentWonMoneyOnLoseString = "32.000 €"
        }
      }
      timeout = 8000
      setTimeout(() => {
        document.getElementById("currentMoneyWin").style.marginLeft = "0px"
      }, 1600);
      setTimeout(() => {
        document.getElementById("currentMoneyWin").style.marginLeft = "-100%"
      }, 6400);
      setTimeout(() => {
        document.getElementById("currentMoneyWin").style.opacity = "0"
        document.getElementById("currentMoneyWin").style.marginLeft = "100%"
      }, 8000);
      setTimeout(() => {
        document.getElementById("currentMoneyWin").style.opacity = "1"
      }, 10000);
    }else if(this.currentQuestionNumber === 16){
      this.currentWonMoneyOnLose = 1000000
      this.currentWonMoneyOnLoseString = "1.000.000 kn"
      if(this.lang == "ger"){
        this.currentWonMoneyOnLoseString = "1.000.000 €"
      }
      this.userData.setRecord(1000000)
      this.userData.setRecordSum(1000000)
      this.userData.setRecordMil()
      timeout = 999999;
      setTimeout(() => {
        document.getElementById("currentMoneyWin").style.marginLeft = "0px"
        this.osiguranText = "OSVOJEN IZNOS"
        if(this.lang == "ger"){
          this.osiguranText = "VERSICHERTER BETRAG"
        }
      }, 1600);
      setTimeout(() => {
        document.getElementById("currentMoneyWin").style.marginLeft = "-100%"
        this.presentAlertConfirm(0)
      }, 6400);
    }
    setTimeout(() => {
      document.getElementById("answerA").style.backgroundImage = "url('../../assets/small_quest.png')"
      document.getElementById("answerB").style.backgroundImage = "url('../../assets/small_quest.png')"
      document.getElementById("answerC").style.backgroundImage = "url('../../assets/small_quest.png')"
      document.getElementById("answerD").style.backgroundImage = "url('../../assets/small_quest.png')"
      item.style.bottom = "0px"
      document.getElementById("info_money").style.top = "0px"
      this.setupQuestion()
      this.clickingAvailable = true;
      document.getElementById("answerA_pTag").style.opacity = "1"
      document.getElementById("answerB_pTag").style.opacity = "1"
      document.getElementById("answerC_pTag").style.opacity = "1"
      document.getElementById("answerD_pTag").style.opacity = "1"
    }, timeout);
  }

  selectAnswer(result){
    if(this.clickingAvailable === false)
      return;

    if(result === 0 && document.getElementById("answerA_pTag").style.opacity === "0"){
      return
    }
    if(result === 1 && document.getElementById("answerB_pTag").style.opacity === "0"){
      return
    }
    if(result === 2 && document.getElementById("answerC_pTag").style.opacity === "0"){
      return
    }
    if(result === 3 && document.getElementById("answerD_pTag").style.opacity === "0"){
      return
    }
    
    this.hideFullhelp()
    var selectedAnswer;
    if(result === this.answerNumberSelected  || this.currentQuestionNumber <= 5){//ponovni odabir istog
      if(result === 0)
        selectedAnswer = document.getElementById("answerA")
      else if(result === 1)
        selectedAnswer = document.getElementById("answerB")
      else if(result === 2)
        selectedAnswer = document.getElementById("answerC")
      else if(result === 3)
        selectedAnswer = document.getElementById("answerD")

      this.clickingAvailable = false;
      if(result === this.correctAnswer){
        setTimeout(() => {
          selectedAnswer.style.backgroundImage = "url('../../assets/small_quest_correct.png')"
          this.soundEditor.playWinSound(this.currentQuestionNumber)
        }, 300);
        setTimeout(() => {
          this.prepareQuestionAnimations()
        }, 1000);  
      }else{
        if(this.correctAnswer === 0)
          selectedAnswer = document.getElementById("answerA")
        else if(this.correctAnswer === 1)
          selectedAnswer = document.getElementById("answerB")
        else if(this.correctAnswer === 2)
          selectedAnswer = document.getElementById("answerC")
        else if(this.correctAnswer === 3)
          selectedAnswer = document.getElementById("answerD")

        selectedAnswer.style.backgroundImage = "url('../../assets/small_quest_correct.png')"
        this.soundEditor.playLoseSound()
        if(this.correctAnswer != this.answerNumberSelected){
          if(result === 0)
            selectedAnswer = document.getElementById("answerA")
          else if(result === 1)
            selectedAnswer = document.getElementById("answerB")
          else if(result === 2)
            selectedAnswer = document.getElementById("answerC")
          else if(result === 3)
            selectedAnswer = document.getElementById("answerD") 
          selectedAnswer.style.backgroundImage = "url('../../assets/small_quest_wait.png')"
          setTimeout(() => {
            this.presentAlertConfirm(3)
            this.askForContinue()
          }, 700);
        }else{
          setTimeout(() => {
            this.presentAlertConfirm(2)
            this.askForContinue()
          }, 700);
        }
        this.userData.setRecord(this.currentWonMoneyOnLose)
        this.userData.setRecordSum(this.currentWonMoneyOnLose)

      }
    }else{
      this.soundEditor.playFinalAnswer()

      if(this.answerNumberSelected !== -1){
        document.getElementById("answerA").style.backgroundImage = "url('../../assets/small_quest.png')"
        document.getElementById("answerB").style.backgroundImage = "url('../../assets/small_quest.png')"
        document.getElementById("answerC").style.backgroundImage = "url('../../assets/small_quest.png')"
        document.getElementById("answerD").style.backgroundImage = "url('../../assets/small_quest.png')"
      }
      this.answerNumberSelected = result;
      if(result === 0)
        selectedAnswer = document.getElementById("answerA")
      else if(result === 1)
        selectedAnswer = document.getElementById("answerB")
      else if(result === 2)
        selectedAnswer = document.getElementById("answerC")
      else if(result === 3)
        selectedAnswer = document.getElementById("answerD")

      selectedAnswer.style.backgroundImage = "url('../../assets/small_quest_wait.png')"
    }    
  }

  getRandomInt(max) {//0,1,2 (3)
    return Math.floor(Math.random() * Math.floor(max));
  }
  getRandomIntInRange(min,max){//3,4,5 (3,6)
    var result = 0;
    while(1){
      result = Math.floor(Math.random() * Math.floor(max));
      if(result >= min && result < max)
        return result
    }
  }
  openSport(){
    window.open("https://play.google.com/store/apps/details?id=com.neoblast.android.iplay")
  }

  jokerAskPublic(){
    if(this.clickingAvailable === false || this.jokers[0] === false)
      return
    document.getElementById("public-X").style.display = "block"
    this.clickingAvailable = false;
    this.jokers[0] = false
    this.soundEditor.stopAllSounds()
    this.soundEditor.playSound(10,false)
    var array = this.calculatePublicAnswer()
    var empty = [0,0,0,0]
    if(document.getElementById("answerA_pTag").style.opacity === "0" || document.getElementById("answerB_pTag").style.opacity === "0" || document.getElementById("answerC_pTag").style.opacity === "0"){
      console.log("joker fifi used")
      var totalOther = 0;
      if(document.getElementById("answerA_pTag").style.opacity === "0"){
        totalOther += array[0]
        array[0] = 0
      }
      if(document.getElementById("answerB_pTag").style.opacity === "0"){
        totalOther += array[1]
        array[1] = 0
      }
      if(document.getElementById("answerC_pTag").style.opacity === "0"){
        totalOther += array[2]
        array[2] = 0
      }
      if(document.getElementById("answerD_pTag").style.opacity === "0"){
        totalOther += array[3]
        array[3] = 0
      }
      for(var i = 0;i<totalOther;i++){
        if(i%2===0){
          for(var j = 0;j < 4;j++){
            if(array[j] != 0){
              array[j] += 1;
              break;
            }
          }
        }else{
          for(var j = 3;j >= 0;j--){
            if(array[j] != 0){
              array[j] += 1;
              break;
            }
          }
        }
      }
    }
    for(var i = 0;i < 100;i++){
      setTimeout(() => {
        empty[0] += array[0]/100
        empty[1] += array[1]/100
        empty[2] += array[2]/100
        empty[3] += array[3]/100

        document.getElementById("answerA_pTag").innerText = (empty[0].toFixed(0)).toString() + "%"
        document.getElementById("answerB_pTag").innerText = (empty[1].toFixed(0)).toString() + "%"
        document.getElementById("answerC_pTag").innerText = (empty[2].toFixed(0)).toString() + "%"
        document.getElementById("answerD_pTag").innerText = (empty[3].toFixed(0)).toString() + "%"
      }, i*40);
    }

    setTimeout(() => {
      this.clickingAvailable = true;
      document.getElementById("answerA_pTag").innerText = this.answerA
      document.getElementById("answerB_pTag").innerText = this.answerB
      document.getElementById("answerC_pTag").innerText = this.answerC
      document.getElementById("answerD_pTag").innerText = this.answerD
      this.soundEditor.stopAllSounds()
      if(this.currentQuestionNumber < 6)
        this.soundEditor.playSound(5,true)
      else
        this.soundEditor.playSound(7,true)
    }, 7000);


  }
  jokerHalfHalf(){
    if(this.clickingAvailable === false || this.jokers[1] === false)
    return
    document.getElementById("fifi-X").style.display = "block"
   this.clickingAvailable = false;
   this.jokers[1] = false
   this.soundEditor.playSound(8,false);

    var secondAnswer = 0;
    while(1){
      secondAnswer = this.getRandomInt(4);
      if(secondAnswer != this.correctAnswer){
        break;
      }
    }
    if(this.correctAnswer !== 0 && secondAnswer !== 0){
      document.getElementById("answerA_pTag").style.opacity = "0"
      this.availableAnswers[0] = null;
    }
    if(this.correctAnswer !== 1 && secondAnswer !== 1){
      document.getElementById("answerB_pTag").style.opacity = "0"
      this.availableAnswers[1] = null;
    }
    if(this.correctAnswer !== 2 && secondAnswer !== 2){
      document.getElementById("answerC_pTag").style.opacity = "0"
      this.availableAnswers[2] = null;
    }
    if(this.correctAnswer !== 3 && secondAnswer !== 3){
      document.getElementById("answerD_pTag").style.opacity = "0"
      this.availableAnswers[3] = null;
    }
    var tmpArray = [];
    for(var i = 0;i<this.availableAnswers.length;i++){
      if(this.availableAnswers[i] !== null)
        tmpArray.push(this.availableAnswers[i])
    }
    this.availableAnswers = tmpArray;
    this.clickingAvailable = true;

  }
  jokerAskFriend(){
    if(this.clickingAvailable === false || this.jokers[2] === false)
      return
    
    document.getElementById("call-X").style.display = "block"
    this.clickingAvailable = false;
    this.jokers[2] = false
    var friendAnswerStart = 0;
    var friendAnswerEnd = 0;
    if(this.currentQuestionNumber <= 5){
      friendAnswerStart = 95;
      friendAnswerEnd = 100;
    }else if(this.currentQuestionNumber <= 10){
      friendAnswerStart = 85;
      friendAnswerEnd = 90;
    }else if(this.currentQuestionNumber <= 15){
      friendAnswerStart = 65;
      friendAnswerEnd = 70;
    }
    var friendAnswer = friendAnswerStart + (this.getRandomInt(2) * 5)
    var isCorrect = (this.getRandomInt(100) < friendAnswer);
    if(isCorrect){
      if(this.lang == "ger"){
        if(this.questionJSON.offered_ger[this.questionJSON.answer] == "...")
          this.callFriend("Ich glaube die Antwort ist " + this.questionJSON.offered[this.questionJSON.answer] , friendAnswer)
        else 
          this.callFriend("Ich glaube die Antwort ist " + this.questionJSON.offered_ger[this.questionJSON.answer] , friendAnswer)
      }else{
        this.callFriend("Mislim da je odgovor " + this.questionJSON.offered[this.questionJSON.answer] , friendAnswer)
      }  
    }else{
      if(this.availableAnswers.length === 2){
        if(this.lang == "ger"){
          this.callFriend("Ich weiß nicht was von den Beiden richtig wäre" , -1)
        }else{
          this.callFriend("Ne znam šta bi od tog dvoje bilo točno" , -1)
        }  
        return
      }else{
        if(this.lang == "ger"){
          if(this.questionJSON.offered_ger[this.questionJSON.answer] == "...")
            this.callFriend("Ich bin mir nicht sicher, aber ich möchte antworten " + this.questionJSON.offered[this.questionJSON.answer] , friendAnswer)
          else
            this.callFriend("Ich bin mir nicht sicher, aber ich möchte antworten " + this.questionJSON.offered_ger[this.questionJSON.answer] , friendAnswer)
        }else{
          this.callFriend("Nisam baš siguran, ali ja bi odgovorio " + this.questionJSON.offered[this.questionJSON.answer] , friendAnswer)
        }
      }
      var secondAnswer = 0;
      while(1){
        var random = this.getRandomInt(this.availableAnswers.length)
        secondAnswer = this.availableAnswers[random];  
        if(secondAnswer != this.correctAnswer){
          break;
        }
      }
      if(this.getRandomInt(2) === 0){
        console.log(this.questionJSON.offered[this.correctAnswer],this.questionJSON.offered[secondAnswer])
      }else{
        console.log(this.questionJSON.offered[secondAnswer],this.questionJSON.offered[this.correctAnswer])
      }
    }

  }

  calculatePublicAnswer(){
    var array = [0,0,0,0]
    var publicStart = 0;
    var publicEnd = 0;
    if(this.currentQuestionNumber <= 5){
      publicStart = 65;
      publicEnd = 90;
    }else if(this.currentQuestionNumber <= 10){
      publicStart = 40;
      publicEnd = 60;
    }else if(this.currentQuestionNumber <= 15){
      publicStart = 30;
      publicEnd = 45;
    }

    array[this.correctAnswer] = this.getRandomIntInRange(publicStart, publicEnd);
    var total = array[this.correctAnswer];
    for(var i = 0;i < 4;i++){
      if(i !== this.correctAnswer){
        if(i == 3){
          array[i] = 100 - total;
        }else{
          array[i] = this.getRandomIntInRange(0, 100 - total)
          total += array[i]
        }
      }
    
    }
    return array;
  }

  
  //1-1,2,3,4,5
  //2-6,7,8
  //3-9,10,11
  //4-12,13
  //5-14,15


  quiz = {
    1:{
      "questions":[
        {
          "question": "Znak za izlaz u slučaju nužde najčešće je u kombinaciji kojih boja?",
          "question_ger":"Das Zeichen fur Notausgang ist meistens in der Kombination von welchen Farben?",
          "offered": [
            "Zeleno-bijeloj",
            "Zeleno-crvenoj",
            "Zeleno-plavoj",
            "Zeleno-rozoj"
          ],
          "offered_ger": [
            "Grün-Weiß",
            "Grün-Rot",
            "Grün-Blau",
            "Grün-Pink"
          ],
          "answer": 0
        },
        {
          "question": "Koliko tjedana ima godina?",
          "question_ger":" Wie viele Wochen hat ein Jahr?",
          "offered": [
            "50",
            "51",
            "52",
            "53"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Koji kemijski element se označava slovom 'O'?",
          "question_ger":"Welches Elementensymbol in Chemie markiert man mit dem Buchstaben 'O'?",
          "offered": [
            "Kisik",
            "Vodik",
            "Zlato",
            "Kalij"
          ],
          "offered_ger": [
            "Sauerstoff",
            "Wasserstoff",
            "Gold",
            "Kalium"
          ],
          "answer": 0
        },
        {
          "question": "Morske struje dijelimo na",
          "question_ger":"Die Meeresströmungen teilen wir auf ",
          "offered": [
            "Tople i hladne",
            "Sjeverne i južne",
            "Lijeve i desne",
            "Brze i spore"
          ],
          "offered_ger": [
            "Warme und kalte",
            "Nordische und Südische",
            "Linke und rechte",
            "Schnelle und langsame"
          ],
          "answer": 0
        },
        {
          "question": "Koji je ocean najveći?",
          "question_ger":"Welches Ozean ist das größte?",
          "offered": [
            "Tihi ocean",
            "Arktički ocean",
            "Europski ocean",
            "Južni ocean"
          ],
          "offered_ger": [
            "der Stille Ozean",
            "Der Arktische Ozean ",
            "Der Europäische Ozean",
            "Der Süd Ozean"
          ],
          "answer": 0
        },
        {
          "question": "Tko je bio predsjednik SAD-a 2016. godine?",
          "question_ger":"Wer war der Staatspräsident der USA im Jahr 2016.?",
          "offered": [
            "Donald Trump",
            "Barack Obama",
            "Joe Biden",
            "George W. Bush"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Koja se valuta koristi u Austriji?",
          "question_ger":"Welche Wahrung verwendet man in Österreich?",
          "offered": [
            "Kuna",
            "Euro",
            "Dolar",
            "Dinar"
          ],
          "offered_ger": [
            "Kuna",
            "Euro",
            "Dollar",
            "Dinar"
          ],
          "answer": 1
        },
        {
          "question": "U kojoj je državi umro Nikola Tesla?",
          "question_ger":"In welchen Land starb Nikola Tesla?",
          "offered": [
            "Srbija",
            "Italija",
            "Hrvatska",
            "SAD"
          ],
          "offered_ger": [
            "Serbien",
            "Italien",
            "Kroatien",
            "USA"
          ],
          "answer": 3
        },
        {
          "question": "Kako se zove društvena mreža koju je 2004. godine osnovao bivši student Harvarda?",
          "question_ger":"Wie heißt das Soziale Netzwerk das im Jahr 2004. ein ehemaliger Student von Harvard gegrundet hat ?  ",
          "offered": [
            "Instagram",
            "Google",
            "Facebook",
            "Steam"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Kolijevka čovječanstva je naziv za područje na kojem kontinentu?",
          "question_ger":"Wiege der Menschheit ist ein Ausdruck fur ein Bereich der auf welchen Kontinent liegt? ",
          "offered": [
            "Azija",
            "Europa",
            "Australija",
            "Afrika"
          ],
          "offered_ger": [
            "Asien",
            "Europa",
            "Australien",
            "Afrika"
          ],
          "answer": 3
        },
        {
          "question": "Prvi svjetski rat počeo je koje godine?",
          "question_ger":"Im welchen Jahr hat der Erste Weltkrieg begonnen?",
          "offered": [
            "1908",
            "1910",
            "1912",
            "1914"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 3
        },
        {
          "question": "Tko je jedini Hrvat koji je postigao gol u dva finala Lige prvaka?",
          "question_ger":"Wer ist der einzige Kroate der ein Tor in zwei Finalspielen der Champions-League  erreicht hat ",
          "offered": [
            "Mario Mandžukić",
            "Luka Modrić",
            "Ivan Rakitić",
            "Ivica Olić"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Koji je naziv za bijele krvne stanice?",
          "question_ger":"Wie heißen die weißen Blutzellen?",
          "offered": [
            "Leukociti",
            "Bazofili",
            "Eritrociti",
            "Trombociti"
          ],
          "offered_ger": [
            "Leukozyten",
            "Bazophili",
            "Erythrozyten",
            "Thrombocyten"
          ],
          "answer": 0
        },
        {
          "question": "Koji je film dobio Oskara za najbolji film 2020. godine?",
          "question_ger":"Welcher Film bekamm ein Oscar für den besten Film im Jahr 2020.?",
          "offered": [
            "Parasite",
            "Mr. & Mrs. Smith",
            "La La Land",
            "Dunkirk"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Koja od ovih rijeka je najduža?",
          "question_ger":"Welcher von diesen Flußen ist der größte?",
          "offered": [
            "Nil",
            "Sava",
            "Kongo",
            "Niger"
          ],
          "offered_ger": [
            "Nil",
            "Save",
            "Kongo",
            "Niger"
          ],
          "answer": 0
        },
        {
          "question": "Gdje je titanik plovio?",
          "question_ger":"Wo segelte Titanic?",
          "offered": [
            "Atlantski ocean",
            "Indijski ocean",
            "Tihi ocean",
            "Europski ocean",
          ],
          "offered_ger": [
            "Atlantische Ozean",
            "Indische Ozean",
            "Stilles Ozean",
            "Europäisches Ozean"
          ],
          "answer": 0
        },
        {
          "question": "Prema posljednjem popisu, Europa ima koliko stanovnika ?",
          "question_ger":"Nach der letzten Bevölkerungszahlung, Europa hat wie viele Bewohner? ",
          "offered": [
            "741 milijuna",
            "112 milijuna",
            "611 milijuna",
            "994 milijuna"
          ],
          "offered_ger": [
            "741 Million",
            "112 Million",
            "611 Million",
            "994 Million"
          ],
          "answer": 0
        },
        {
          "question": "Naziva Argentum i kemijskog simbola Ag je koji element?",
          "question_ger":"Es bezeichnet sich als Argentum und Elementsymbol ist Ag. Welches Element ist das?",
          "offered": [
            "Zlato",
            "Srebro",
            "Ugljik",
            "Aluminij"
          ],
          "offered_ger": [
            "Gold",
            "Silber",
            "Kohlenstoff",
            "Aluminium"
          ],
          "answer": 1
        },
        {
          "question": "Koliko je dana imala veljača 1996. godine?",
          "question_ger":"Wie viel Tage hatte Februar im Jahr 1996.?",
          "offered": [
            "27",
            "28",
            "29",
            "30"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Postupak proglašavanja neke osobe svetim zove se ...",
          "question_ger":"Ein Prozess in dem man eine Person als Heilig proklamiert heißt...?",
          "offered": [
            "Kanonizacija",
            "Legalizacija",
            "Svetizacija",
            "Katolizacija"
          ],
          "offered_ger": [
            "Kanonization",
            "Legalization",
            "Gerolization",
            "Katolization"
          ],
          "answer": 0
        },
        {
          "question": "Junak Gothama je ",
          "question_ger":"Der Held von Gotham ist",
          "offered": [
            "Superman",
            "Batman",
            "Spiderman",
            "Ironman"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Što je papaja?",
          "question_ger":"Was ist Papaya?",
          "offered": [
            "Afrički grabežljivac",
            "Vrsta majmuna",
            "Indijski lijek",
            "Tropsko voće"
          ],
          "offered_ger": [
            "ein Afrikanisches Raubtier",
            "eine Art von Affe",
            "ein Indisches Medikament",
            "Tropische Frucht"
          ],
          "answer": 3
        },
        {
          "question": "Geigerov brojač ili Geiger-Mullerovo brojilo je mjerni instrument čega?",
          "question_ger":"Der Geiger Zähler oder der Geiger-Muller Zähler ist ein Messgerät für was?",
          "offered": [
            "Vlažnosti",
            "Temperature",
            "Radioaktivnosti",
            "Protonskog kretanja"
          ],
          "offered_ger": [
            "Feuchtigkeit",
            "Temperatur",
            "Radioaktivität",
            "Protonische Bewegung"
          ],
          "answer": 2
        },
        {
          "question": "Ako ste na teniskom turniru Wimbledon u kojem se gradu nalazite?",
          "question_ger":"Wenn Sie auf dem Tennis Turnier Wimbledon sind, in welcher Stadt befinden sie sich ?",
          "offered": [
            "Sydney",
            "London",
            "Berlin",
            "Tokio"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Apsolutna nula ili 0 Kelvina iznosi koliko stupnjeva Celzija?",
          "question_ger":"Absolute Null oder 0 Kelvin hat wie viel Grad Celsius?",
          "offered": [
            "- 215,73",
            "- 217,13",
            "- 273,15",
            "- 237,15"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Koji je najveći kontinent?",
          "question_ger":"Der größte Kontinent ist ?",
          "offered": [
            "Azija",
            "Afrika",
            "Europa",
            "Australija"
          ],
          "offered_ger": [
            "Asien",
            "Afrika",
            "Europa",
            "Australien"
          ],
          "answer": 0
        },
        {
          "question": "Ako pričamo o jednogodišnjim biljkama, o čemu zapravo pričamo?",
          "question_ger":"Wenn wir von einjährigen Pflanzen sprechen, worüber sprechen wir wirklich ?",
          "offered": [
            "Žitaricama",
            "Lubenicama",
            "Boru",
            "Ružama"
          ],
          "offered_ger": [
            "Getreide",
            "Wassermelone",
            "Kiefer",
            "Rosen"
          ],
          "answer": 0
        },
        {
          "question": "Ornitologija je znanost čega?",
          "question_ger": "Ornithologie ist eine Wissenschaft von was ?",
          "offered": [
            "Šuma",
            "Ptica",
            "Organa",
            "Gljiva"
          ],
          "offered_ger": [
            "Walder",
            "Vogel",
            "Organe",
            "Pilze"
          ],
          "answer": 1
        },
        {
          "question": "Koji broj je potrebno kubirati da rezultati sadrži istu znamenku?",
          "question_ger": "Welche Zahl soll kubiert werden dass das Ergebniss dieselbe Ziffer enthält?",
          "offered": [
            "2",
            "3",
            "5",
            "7"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Nema svaka stonoga sto nogu, koliko ih najmanje može imati?",
          "question_ger": "Nicht alle Tausendfüssler haben hundert Beine, wie viele kann sie am wenigsten haben ?",
          "offered": [
            "26",
            "38",
            "40",
            "64"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Latinski 'novem' u prijevodu znači koji broj?",
          "question_ger": "Lateinisch 'novem' übersetzt heißt welche Zahl ?",
          "offered": [
            "8",
            "9",
            "10",
            "11"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Koja država ima domenu s nastavkom '.fr' ?",
          "question_ger": "Lateinisch 'novem' übersetzt heißt welche Zahl ?",
          "offered": [
            "Francuska",
            "Fiji",
            "Finska",
            "Falklandski Otoci"
          ],
          "offered_ger": [
            "Frankreich",
            "Fidschi",
            "Finland",
            "Falklandinsel"
          ],
          "answer": 0
        },
        {
          "question": "Koja država ima domenu s nastavkom '.fr' ?",
          "question_ger": "Welches Land hat eine Domäne mit der Fortsetzung 'fr' ?",
          "offered": [
            "Francuska",
            "Fiji",
            "Finska",
            "Falklandski Otoci"
          ],
          "offered_ger": [
            "Frankreich",
            "Fidschi",
            "Finland",
            "Falklandinsel"
          ],
          "answer": 0
        },
        {
          "question": "Tko je izbacio procesor pod nazivom 'Pentium'?",
          "question_ger": "Wer hat den Prozessor mit dem Namen 'Pentium' veröffentlicht ?",
          "offered": [
            "Intel",
            "AMD",
            "CSM",
            "Pants"
          ],
          "offered_ger": [
            "Intel",
            "AMD",
            "CSM",
            "Pents"
          ],
          "answer": 0
        },
        {
          "question": "Koliko je zbroj kutova u trokutu?",
          "question_ger": "Wie groß ist die Summe der Winkel im Dreieck ?",
          "offered": [
            "180",
            "360",
            "120",
            "420"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Kako glasi ime žene bivšeg predsjednika SAD-a, Baracka Obame?",
          "question_ger": "Wie lautet der Name der Ehefrau von ehemaligen Präsidenten der Vereinigten Staaten, Barack Obama ?",
          "offered": [
            "Michelle",
            "Melania",
            "Minea",
            "Morissa"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Kojoj od navedenih pjesama nije autor Eminem?",
          "question_ger": "Von welchen  genannten Lieder ist Eminem nicht der Autor ?",
          "offered": [
            "Without me",
            "Not Afraid",
            "Rap Master",
            "Stan"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Znanost o kretanju ili ...?",
          "question_ger": "Die Wissenschaft der Bewegung oder ...?",
          "offered": [
            "Kineziologija",
            "Oftamologija",
            "Stomatologija",
            "Mamologija"
          ],
          "offered_ger": [
            "Kinesiologie",
            "Ophthalmology",
            "Zahnmedizin",
            "Mammologie"
          ],
          "answer": 0
        },
        {
          "question": "Koji od navedenih planeta ima najviše prirodnih satelita?",
          "question_ger":"Welcher von den gegebenen Planeten had die meisten Natursatelitten?",
          "offered": [
            "Saturn",
            "Merkur",
            "Jupiter",
            "Neptun"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Koje djelo nije napisao William Shakespeare?",
          "question_ger":"Welches Werk hat William Shakespeare nicht geschrieben?",
          "offered": [
            "Romeo i Julija",
            "Hamlet",
            "Kralj Lear",
            "Princezini dnevnici"
          ],
          "offered_ger": [
            "Romeo und Juliet",
            "Hamlet",
            "König Lear",
            "Das Tagebuch einer Prinzessin"
          ],
          "answer": 3
        },
        {
          "question": "Prijevod 'Alea iacta est' je",
          "question_ger":"Die Übersetzung von 'Alea iacta est' ist?",
          "offered": [
            "Moli i radi",
            "Kocka je bačena",
            "Zvijezdama u visine",
            "Ljubav sve pobjeđuje"
          ],
          "offered_ger": [
            "Bete und arbeite",
            "der Würfel ist gefallen",
            "Mit Sternen in die Höhe",
            "Liebe siegt alles"
          ],
          "answer": 1
        },
        {
          "question": "S kim je Hrvatska igrala u finalu na svjetskom nogometnom prvenstvu 2018. godine?",
          "question_ger":"Mit wem spielte Kroatien im Finale der Fusball - Weltmeisterschaft im Jahr 2018. ?",
          "offered": [
            "Argentinom",
            "Rusijom",
            "Nizozemskom",
            "Francuskom"
          ],
          "offered_ger": [
            "Argentinien",
            "Rusland",
            "Niederlande",
            "Frankreich"
          ],
          "answer": 3
        },
        {
          "question": "Tko je na novčanici od 1 dolar?",
          "question_ger":"Wer ist auf der Geldschein von 1 Dollar?",
          "offered": [
            "George Washington",
            "Thomas Jefferson",
            "Nikola Tesla",
            "Woodrow Wilson"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Kontinent s najvećom površinom je",
          "question_ger":"Das Kontinent mit der größten Oberfläche ist?",
          "offered": [
            "Azija",
            "Afrika",
            "Sjeverna Amerika",
            "Europa"
          ],
          "offered_ger": [
            "Asien",
            "Afrika",
            "Nordamerika",
            "Europa"
          ],
          "answer": 0
        },
        {
          "question": "Popis predsjednika Republike Hrvatske počinje s kojom osobom?",
          "question_ger":"Die Auflistung von Präsidenten der Kroatischen Republik beginnt mit welcher Person?",
          "offered": [
            "Stjepan Mesić",
            "Vlatko Pavletić",
            "Zlatko Tomčić",
            "Franjo Tuđman"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 3
        },
        {
          "question": "H2SO4 je oznaka čega?",
          "question_ger":"H2SO4 ist das Zeichen von?",
          "offered": [
            "Klorovodične kiseline",
            "Sumporne kiseline",
            "Dušične kiseline",
            "Fosforne kiseline"
          ],
          "offered_ger": [
            "Salzsäure",
            "Schwefelsäure",
            "Salpetersäure",
            "Phosphorsäure"
          ],
          "answer": 1
        },
        {
          "question": "Drugi svjetski rat počeo je koje godine?",
          "question_ger":"In welchen Jahr hat der Zweite Weltkrieg begonnen?",
          "offered": [
            "1938",
            "1939",
            "1940",
            "1941"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Kristofor Kolumbo je koje godine stupio na tlo 'Novoga svijeta' ?",
          "question_ger":"In welchen Jahr hat Christoph Columbus auf den Boden des 'Neues weltes' aufgetretten?",
          "offered": [
            "1492",
            "1502",
            "1505",
            "1519"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Glavni grad Egipta je",
          "question_ger":"Die Hauptstadt von Egypten ist",
          "offered": [
            "Aim Shems",
            "Cairo",
            "Giza",
            "Warraq"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Engleska abeceda sastoji se od koliko slova?",
          "question_ger":"Das Englische Alphabet hat wie viele Buchstaben?",
          "offered": [
            "25",
            "26",
            "28",
            "29"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Ako se nalazimo u Kijevu koje ćemo pismo najčešće vidjeti?",
          "question_ger":"Wenn wir sich in Kiew befinden welche Schrift sehen wir am meisten?",
          "offered": [
            "Latinicu",
            "Hangul",
            "Ćirilicu",
            "Devanagari"
          ],
          "offered_ger": [
            "Lateinische",
            "Koreanische/Hangul",
            "Kyrillische",
            "Devanagari?"
          ],
          "answer": 2
        },
        {
          "question": "Tko je autor Mona Lise?",
          "question_ger":"Wer ist der Autor/Verfasser von Mona Lisa?",
          "offered": [
            "Leonardo da Vinci",
            "Pablo Picasso",
            "Vincent van Gogh",
            "Giovanni Branca"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Od čega se pravi votka?",
          "question_ger":"Von welcher Zutat ist Vodka hergestellt?",
          "offered": [
            "Krumpira",
            "Šećerne trske",
            "Kaktusa",
            "Korijenja"
          ],
          "offered_ger": [
            "Kartoffel",
            "Zuckerrohr",
            "Kaktee",
            "Stämme"
          ],
          "answer": 0
        },
        {
          "question": "Majicu na kakve pruge tradicionalno vežemo uz mornare?",
          "question_ger":"Was fur Streifen haben T-Shirts die wir traditionell mit Seemänner verbinden?",
          "offered": [
            "Zeleno-bijele",
            "Crno-bijele",
            "Žuto-bijele",
            "Plavo-bijele"
          ],
          "offered_ger": [
            "Grün-Weiß",
            "Schwarz-Weiß",
            "Gelb-Weiß",
            "Blau-Weiß"
          ],
          "answer": 3
        },
        {
          "question": "Koji je najviši čin u mornarici?",
          "question_ger":"Was ist das höchste Dienstgrad in der Flotte?",
          "offered": [
            "General",
            "Admiral",
            "Pukovnik",
            "Mornar"
          ],
          "offered_ger": [
            "General",
            "Flottenadmiral",
            "Oberst",
            "Seemann"
          ],
          "answer": 1
        },
        {
          "question": "Na kojem ćemo kontinentu najčešće vidjeti koalu?",
          "question_ger":"Auf welchen Kontinent konnen wir am häufigsten einen Koalabar sehen? ",
          "offered": [
            "Afrika",
            "Australija",
            "Europa",
            "Azija"
          ],
          "offered_ger": [
            "Afrika",
            "Australien",
            "Europa",
            "Asien"
          ],
          "answer": 1
        },
        {
          "question": "Kojeg znaka nema u Ohmovu trokutu?",
          "question_ger":"Welches Zeichen gibt es in Ohms Dreieck nicht?",
          "offered": [
            "I",
            "U",
            "W",
            "R"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Kraj koje su se rijeke šetali Kukunka, Taranta i Juju?",
          "question_ger":"Neben welchen Fluss spazierten Kukunka, Taranta und Juju?",
          "offered": [
            "Kraj Nila",
            "Kraj Dunava",
            "Kraj Amazone",
            "Kraj Inda"
          ],
          "offered_ger": [
            "neben Nil Fluss",
            "neben Donau Fluss",
            "neben Amazonas Fluss",
            "neben Inde Fluss"
          ],
          "answer": 0
        },
        {
          "question": "S čime najčešće poslužuju kolu u našim kafićima?",
          "question_ger":"In unseren Caffees dienen sie eine Cola am meisten mit was?",
          "offered": [
            "S kriškom kivija",
            "S kriškom mandarine",
            "S kriškom limuna",
            "S kriškom jabuke"
          ],
          "offered_ger": [
            "mit einer Kiwischeibe",
            "mit einer Mandarinenscheibe",
            "mit einer Zitronenscheibe",
            "mit einer Apfelscheibe"
          ],
          "answer": 2
        },
        {
          "question": "Koliko 'sedmica' imamo od 70 do 79, uključujući te brojeve?",
          "question_ger":"Wie viele Siebner haben wir von 70 bis 79, einschlisslich diese Zahlen? ",
          "offered": [
            "9",
            "10",
            "11",
            "12"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Ono što je jasno i razumno, uvijek je i...",
          "question_ger":"Das was klar und vernünftig ist, ist immer auch",
          "offered": [
            "Bircuz",
            "Bistro",
            "Betula",
            "Bife"
          ],
          "offered_ger": [
            "Bar",
            "Bistro",
            "Bethula",
            "Buffet"
          ],
          "answer": 1
        },
        {
          "question": "Koji konjski rekvizit praznovjernima služi za donošenje sreće?",
          "question_ger":"Welcher Pferd Prop dient Aberglaubichen als Glucksbringer?",
          "offered": [
            "Ular",
            "Žvale",
            "Kopito",
            "Potkova"
          ],
          "offered_ger": [
            "Halfter",
            "Kaut",
            "Huf",
            "Hufeisen"
          ],
          "answer": 3
        },
        {
          "question": "Koja padeža ima njmački jezik?",
          "question_ger":"Wie viel Falle gibt es in der deutschen Sprache?",
          "offered": [
            "4",
            "5",
            "6",
            "7"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "U kojoj se državi nalazi grad Mumbai?",
          "question_ger":"Im welchen Land befindet sich die Stadt Mumbai?",
          "offered": [
            "Indiji",
            "Japanu",
            "Kini",
            "Pakistanu"
          ],
          "offered_ger": [
            "Indien",
            "Japan",
            "China",
            "Pakistan"
          ],
          "answer": 0
        },
        {
          "question": "Koja životinja ima najbolji vid?",
          "question_ger":"Welches Tier had die beste Sehkraft?",
          "offered": [
            "Vepar",
            "Sokol",
            "Tigar",
            "Dupin"
          ],
          "offered_ger": [
            "der Keiler",
            "der Falke",
            "der Tiger",
            "der Delphin"
          ],
          "answer": 1
        },
        {
          "question": "Na čijem logu ne možemo vidjeti životinju?",
          "question_ger":"Auf welchem Logo können wir kein Tier sehen?",
          "offered": [
            "Jaguar",
            "Chevrolet",
            "Lamborghini",
            "Porsche"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Koliko igrača ima na terenu tijekom rukometne utakmice uključujući golmane?",
          "question_ger":"Wie viel Spieler gibt es auf dem Feld im laufe eines Handballspiels einschlieslich mit den Torwartern?",
          "offered": [
            "12",
            "14",
            "16",
            "18"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Koliko centimetara iznosi jedan inch?",
          "question_ger":"Wie viele Zentimeter hat ein Inch?",
          "offered": [
            "1,58",
            "2,54",
            "5,52",
            "7,96"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Što ćemo najčešće razbijati za Uskrs?",
          "question_ger":"Was wird auf Ostern am meisten zerschmettert?",
          "offered": [
            "Jaja",
            "Prozore",
            "Čaše",
            "Stolice"
          ],
          "offered_ger": [
            "Eier",
            "Fenster",
            "Gläser",
            "Stühle"
          ],
          "answer": 0
        },
        {
          "question": "Koji broj je XXVI ?",
          "question_ger":"Welche Zahl ist XXVI?",
          "offered": [
            "16",
            "26",
            "56",
            "106"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Što je radna površina na zaslonu računala neurednija, na njoj je više čega?",
          "question_ger":"Desto mehr das Desktop auf einem Computer chaotischer ist, auf ihm ist mehr was ? ",
          "offered": [
            "Marina",
            "Ikona",
            "Portreta",
            "Veduta"
          ],
          "offered_ger": [
            "Marines",
            "Symbole",
            "Portraits",
            "Verdut"
          ],
          "answer": 1
        },
        {
          "question": "Po čemu je nazvano rekreativno uspinjanje na visoke planine i strme stijene?",
          "question_ger":"Nach was wurde das Freizeitaufstieg auf das Hochgebirge und steile Felsen benannt?",
          "offered": [
            "Po Alpama",
            "Po Karptina",
            "Po Pirinejima",
            "Po Dinaridima"
          ],
          "offered_ger": [
            "Alpen",
            "Mount Karptina",
            "Pyrenaen",
            "Dinarides"
          ],
          "answer": 0
        },
        {
          "question": "Koja je država najpoznatija po mumificiranju?",
          "question_ger":"Welches Land ist meistbekannt für Mumifizierung?",
          "offered": [
            "Rusija",
            "Egipat",
            "Iran",
            "Irak"
          ],
          "offered_ger": [
            "Russland",
            "Egypt",
            "Iran",
            "Irak"
          ],
          "answer": 1
        },
        {
          "question": "Što umjesto pluća imaju ribe?",
          "question_ger":"Was haben Fische statt Lungen?",
          "offered": [
            "Uši",
            "Peraje",
            "Škrge",
            "Rep"
          ],
          "offered_ger": [
            "Ohren",
            "Flossen",
            "Kiemen",
            "Schwänze"
          ],
          "answer": 2
        },
        {
          "question": "Koja se životinja rađa iz jaja?",
          "question_ger":"Welches Tier wird aus einem Ei geboren?",
          "offered": [
            "Metilj",
            "Mačka",
            "Delfin",
            "Krokodil"
          ],
          "offered_ger": [
            "Leberegel",
            "Katze",
            "Delphin",
            "Krokodil"
          ],
          "answer": 3
        },
        {
          "question": "Ahilovo ranjivo mjesto bilo je...",
          "question_ger":"Welche ist die von Achilles verwundbare Stelle?",
          "offered": [
            "Srce",
            "Oko",
            "Peta",
            "Koljeno"
          ],
          "offered_ger": [
            "Herz",
            "Auge",
            "Ferse",
            "Knie"
          ],
          "answer": 2
        },
        {
          "question": "Što nije elementarna nepogoda?",
          "question_ger":"Was ist kein Elementarschaden?",
          "offered": [
            "Potres",
            "Požar",
            "Glad",
            "Poplava"
          ],
          "offered_ger": [
            "Erdbeben",
            "Brand",
            "Hunger",
            "Flut"
          ],
          "answer": 2
        },
        {
          "question": "Koji je zid izgrađen 1961. godine?",
          "question_ger":"Welche Mauer wurde im 1961. gebaut?",
          "offered": [
            "Berlinski zid",
            "Zid plača",
            "Kineski zid",
            "Zid srama"
          ],
          "offered_ger": [
            "die Berliner Mauer",
            "die Klage Mauer",
            "die Chinesische Mauer",
            "die Scham Mauer"
          ],
          "answer": 0
        },
        {
          "question": "Tko je tvorac Marvel Comics?",
          "question_ger":"Schöpfer von Marvel Comics ist?",
          "offered": [
            "Stan Lee",
            "Bruce Lee",
            "Jason Lee",
            "In Lee"
          ],"offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Koja od navedenih država nije u Africi?",
          "question_ger":"Welche von dargestellten Ländern ist nicht in Afrika?",
          "offered": [
            "Maroko",
            "Egipat",
            "Tunis",
            "Indija"
          ],
          "offered_ger": [
            "Marokko",
            "Egypt",
            "Tunesien",
            "Indien"
          ],
          "answer": 3
        },
        {
          "question": "Kojeg metala ima najviše u Zemlji?",
          "question_ger":"Welchen Metall gibt es am meisten auf der Erde?",
          "offered": [
            "Zlata",
            "Cinka",
            "Željeza",
            "Kroma"
          ],
          "offered_ger": [
            "Gold",
            "Zink",
            "Eisen",
            "Chrom"
          ],
          "answer": 2
        },
        {
          "question": "Koja država okružuje Vatikan?",
          "question_ger":"Welches Land umkreisst den Vatikan?",
          "offered": [
            "Portugal",
            "Italija",
            "Španjolska",
            "Austrija"
          ],
          "offered_ger": [
            "Portugal",
            "Italien",
            "Spanien",
            "Österreich"
          ],
          "answer": 1
        },
        {
          "question": "Dvoranski nogomet još nazivamo...",
          "question_ger":"Hallenfußball nennen wir noch...",
          "offered": [
            "Futsal",
            "Smaball",
            "Fastsal",
            "Salfoot"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Koliko je bilo apostola?",
          "question_ger":"Wie viele Apostel gab es?",
          "offered": [
            "10",
            "11",
            "12",
            "14"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Koliko vrhova ima Davidova zvijezda?",
          "question_ger":"Wie viele Spitzen hat Davids Stern?",
          "offered": [
            "4",
            "5",
            "6",
            "8"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Kako nazivamo sve šume koja ne odbacuje lišće?",
          "question_ger":"Wie nennt man alle Walder die keine Blätter verwerfen",
          "offered": [
            "Crnogorične",
            "Bjelogorične",
            "Sivogorične",
            "Cijelogorične"
          ],
          "offered_ger": [
            "Nadelwalder",
            "Laubwalder",
            "graubrennende Walder",
            "Vollseewalder"
          ],
          "answer": 0
        },
        {
          "question": "Koji je glavni sastojak vina?",
          "question_ger":"Was ist die Hauptzutat im Wein?",
          "offered": [
            "Grožđe",
            "Jabuka",
            "Kruška",
            "Malina"
          ],
          "offered_ger": [
            "Trauben",
            "Apfel",
            "Birne",
            "Himbeere"
          ],
          "answer": 0
        },
        {
          "question": "Koji je narod prvi u Europi počeo upotrebljavati željezni mač?",
          "question_ger":"Welches Land in Europa hat zuerst das Eisenschwert benutzt?",
          "offered": [
            "Normani",
            "Turci",
            "Grci",
            "Rimljani"
          ],
          "offered_ger": [
            "Normannen",
            "Türken",
            "Griechen",
            "Römer"
          ],
          "answer": 3
        },
        {
          "question": "Tko je 395. godine razdijelio Rimsko carstvo na zapadno i istočno?",
          "question_ger":"Wer hat im Jahr 395. das Römische Reich geteilt auf Westen und Osten ",
          "offered": [
            "Justinijan",
            "Heraklije",
            "Konstantin VII",
            "Teodozije"
          ],
          "offered_ger": [
            "Justinian",
            "Herakules",
            "Konstantin VII",
            "Theodysian"
          ],
          "answer": 3
        },
        {
          "question": "Koju boju možemo vidjeti na zastavi Republike Slovenije?",
          "question_ger":"Welche Farbe könenn wir auf der Flagge von Republik Slowenien sehen?",
          "offered": [
            "Zelenu",
            "Plavu",
            "Sivu",
            "Rozu"
          ],
          "offered_ger": [
            "Grün",
            "Blau",
            "Grau",
            "Pink"
          ],
          "answer": 1
        },
        {
          "question": "Kojem mitskom stvorenju narastu još dvije glave, ako joj odrežemo jednu?",
          "question_ger":"Welchem Fabelwesen wachsen noch zwei Köpfe,wenn wir einen seiner Köpfe schneiden?",
          "offered": [
            "Kopljača",
            "Trakavica",
            "Hidra",
            "Virnjak"
          ],
          "offered_ger": [
            "mythische Speerkreatur",
            "Bandwurm",
            "Hydra",
            "Virdum"
          ],
          "answer": 2
        },
        {
          "question": "Koja ptica u Andersenovoj priči raspjevanoj djeci donosi braću i sestre?",
          "question_ger":"Welcher Vogel in der Andersens Geschichte bringt den singenden Kinder Brüder und Schwestern?",
          "offered": [
            "Roda",
            "Vrana",
            "Čiopa",
            "Galeb"
          ],
          "offered_ger": [
            "Storchenvogel",
            "Kraehenvogel",
            "Beehed",
            "Mowenvogel"
          ],
          "answer": 0
        },
        {
          "question": "Tko ima lulu u ustima i špinat u ruci?",
          "question_ger":"Wer hat eine Pfeife im Mund und Spinat in der Hand?",
          "offered": [
            "Flash",
            "Tarzan",
            "Popaj",
            "Baltazar"
          ],
          "offered_ger": [
            "Flash",
            "Tarzan",
            "Popeye",
            "Balthazar"
          ],
          "answer": 2
        },
        {
          "question": "Koja 'životinjica', ako je bacimo na pravi način, skakuće po mirnoj vodenoj površini?",
          "question_ger":"Welches Tier, wenn wir es auf die richtige Art und Weise werfen, hüpft auf einer ruhigen Wasseroberfläche?",
          "offered": [
            "Žabica",
            "Skakavčić",
            "Klokančić",
            "Žirafica"
          ],
          "offered_ger": [
            "Froschchen",
            "Heuschreckchen",
            "Kangaroo",
            "Giraffe"
          ],
          "answer": 0
        },
        {
          "question": "Za učenika koji je danima marljivo učio, ispit će biti...",
          "question_ger":"Fur den Schüller der fleißig lernt, die Prüfung wird sein ...",
          "offered": [
            "Mačji kašalj",
            "Pačja hunjavica",
            "Pasje šmrcanje",
            "Žablji štucaj"
          ],
          "offered_ger": [
            "Katzenhusten",
            "Entenschnupfen",
            "Hundeschnüffel",
            "Froschschluckauf"
          ],
          "answer": 0
        },
        {
          "question": "Koja je zemlja sve do 18. stoljeća bila gotovo isključivi proizvođač dijamanata na svijetu?",
          "question_ger":"Welches Land war bis zum 18. Jahundert fast ausschließlich der Hersteller von Diamanten in der Welt?",
          "offered": [
            "Kina",
            "Francuska",
            "Indija",
            "Japan"
          ],
          "offered_ger": [
            "China",
            "Frankreich",
            "Indien",
            "Japan"
          ],
          "answer": 2
        },
        {
          "question": "Što se mjeri newtonima?",
          "question_ger":"Was wird durch Newton gemessen?",
          "offered": [
            "Put",
            "Sila",
            "Brzina",
            "Vrijeme"
          ],
          "offered_ger": [
            "Weg",
            "Kraft",
            "Geschwindigkeit",
            "Zeit"
          ],
          "answer": 1
        },
        {
          "question": "Mliječni šećer je ...",
          "question_ger":"Milchzucker ist ...",
          "offered": [
            "Laktoza",
            "Fruktoza",
            "Glukoza",
            "Saharoza"
          ],
          "offered_ger": [
            "Laktose",
            "Fructose",
            "Glukose",
            "Saccharose"
          ],
          "answer": 0
        },
        {
          "question": "Kako Talijani zovu prvu nogometnu ligu?",
          "question_ger":"Wie nennen die Italiener die erste Fussball-Liga?",
          "offered": [
            "Bundesliga",
            "Premiership",
            "Serije A",
            "HNL"
          ],
          "offered_ger": [
            "Bundesliga",
            "Premiership",
            "Serie A",
            "Kroatische Fussball-Liga"
          ],
          "answer": 2
        },
        {
          "question": "Koje životinje ima više nego ljudi?",
          "question_ger": "Welche Tiere gibt es mehr als Menschen?",
          "offered": [
            "Slonova",
            "Mrava",
            "Krokodila",
            "Nosoroga"
          ],
          "offered_ger": [
            "Elefanten",
            "Ameisen",
            "Krokodile",
            "Nashörner"
          ],
          "answer": 1
        },
        {
          "question": "U kojoj je državi rođen Lionel Messi?",
          "question_ger":"In welchem Land ist Lionel Messi geboren?",
          "offered": [
            "Španjolskoj",
            "Portugalu",
            "Argentini",
            "Brazilu"
          ],
          "offered_ger": [
            "Spanien",
            "Portugal",
            "Argentinien",
            "Brasil"
          ],
          "answer": 2
        },
        {
          "question": "Prvog svibnja je međunarodni praznik ...",
          "question_ger":"Der 1.Mai ist der internationale Feiertag...",
          "offered": [
            "Rada",
            "Spavanja",
            "Mora",
            "Hrane"
          ],
          "offered_ger": [
            "Arbeit",
            "Schlaffen",
            "Meer",
            "Nahrung"
          ],
          "answer": 0
        },
        {
          "question": "Traperice najčešće možemo vidjeti u kojoj boji?",
          "question_ger":"Eine Jeanshose sehen wir meistens in welcher Farbe?",
          "offered": [
            "Plavoj",
            "Zelenoj",
            "Žutoj",
            "Smeđoj"
          ],
          "offered_ger": [
            "Blau",
            "Grün",
            "Gelb",
            "Braun"
          ],
          "answer": 0
        },
        {
          "question": "Kako zovemo najbolji rezultati, onaj koji nadmašuje sve prethodne rezultate?",
          "question_ger":"Wie nennt man das beste Ergebnis, eins das alle bisherigen Ergebnisse übertrifft?",
          "offered":[
            "Rekord",
            "Bubanj",
            "Poredak",
            "Stalak"
          ],
          "offered_ger": [
            "Rekord",
            "Trommel",
            "Rangliste",
            "Gestell"
          ],
          "answer": 0
        },
        {
          "question": "Koja je kratica za istosmjernu struju?",
          "question_ger":"Welche Kürzung ist für den direkten Strom?",
          "offered": [
            "DC",
            "AC",
            "MC",
            "PC"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Koji je najmanji dvoznamenkasti prosti broj?",
          "question_ger":"Welche ist die kleinste zweistellige einfache Nummer?",
          "offered": [
            "10",
            "11",
            "12",
            "13"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Koji je najveći iznos koji možemo osvojiti u 'Tko želi biti milijunaš'?",
          "question_ger":"Welche ist die größte Summe die wir gewinnen können in 'Wer will Millionar werden'",
          "offered": [
            "1.000.000 € ",
            "500.000 €",
            "100.000 €",
            "1.000 €"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Kako se zove šahovski potez u kojem se pomiču dvije figure, a računa se kao jedan potez?",
          "question_ger":"Wie heißt der Schachzug in dem sich zwei Figuren bewegen, aber man zählt es als ein Zug?",
          "offered": [
            "Rokada",
            "Leh Do",
            "Abductio",
            "En Passant"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Ako je Božić u petak, koji je dan Nova godina?",
          "question_ger":"Wenn Weihnachten am Freitag ist, am welchen Tag ist Neujahr?",
          "offered": [
            "Srijeda",
            "Petak",
            "Subota",
            "Nedjelja"
          ],
          "offered_ger": [
            "Mittwoch",
            "Freitag",
            "Samstag",
            "Sonntag"
          ],
          "answer": 1
        },
        {
          "question": "U maloj bari je puno koga?",
          "question_ger":"Im kleinen Teich sind viele? ",
          "offered": [
            "Nilskih konja",
            "Somova",
            "Krokodila",
            "Zmija"
          ],
          "offered_ger": [
            "Nilpferde",
            "Welsen",
            "Krokodile",
            "Schlangen"
          ],
          "answer": 2
        },
        {
          "question": "Koja nas popularna kratica 'tjera' da nešto hitno obavimo?",
          "question_ger":"Welche beliebte Kürzung treibt uns, um etwas Dringendes zu erledigen?",
          "offered": [
            "ASAP",
            "BTW",
            "LOL",
            "OMG"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Što je mladić dobio od djevojke koja je odbila njegov poziv na spoj?",
          "question_ger":"Was hat ein junger Mann von einem Mädchen bekommen, die seine Einladung zu einem Treffen abgelehnt hat? ",
          "offered": [
            "Košaricu",
            "Nožić",
            "Čašicu",
            "Teglicu"
          ],
          "offered_ger": [
            "Korb",
            "Messerchen",
            "Gläschen",
            "Töpfchen"
          ],
          "answer": 0
        },
        {
          "question": "U filnalnoj sceni Tarantinova posljednjeg filma pojavljuje se rečenica 'Bilo jednom ...",
          "question_ger":"In der letzten Szene von Tarantinos letztem Film erscheint der Satz 'Es war einmal?' ",
          "offered": [
            "Na Divljem zapadu",
            "U Americi",
            "U Meksiku",
            "U Hollywoodu"
          ],
          "offered_ger": [
            "Im Widen Westen",
            "In America",
            "In Meksiko",
            "In Hollywood"
          ],
          "answer": 3
        },
        {
          "question": "Koje životinje, u poznatom izrazu, prve napuštaju brod koji tone?",
          "question_ger":"Welche Tiere im berühmten Ausdruck verlassen als erste das sinkende Schiff? ",
          "offered": [
            "Psi",
            "Ježevi",
            "Konji",
            "Štakori"
          ],
          "offered_ger": [
            "Hunde",
            "Igeln",
            "Pferde",
            "Ratten"
          ],
          "answer": 3
        },
        {
          "question": "Koja boja označava pogrešku na računalu?",
          "question_ger":"Welche Farbe bezeichnet ein Fehler auf dem Computer?",
          "offered": [
            "Žuta",
            "Crvena",
            "Plava",
            "Smeđa"
          ],
          "offered_ger": [
            "Gelb",
            "Rot",
            "Blau",
            "Braun"
          ],
          "answer": 1
        },
        {
          "question": "Najtrofejniji engleski nogometni klub je",
          "question_ger":"Welcher englischer Fußballverein hat die meisten Trophäen?",
          "offered": [
            "Liverpool",
            "Everton",
            "Man. United",
            "Chelsea"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Koliko poena vrijedi koš iz slobodnog bacanja u košarci?",
          "question_ger":"Wie viele Punkte ist ein Freiwurf in Basketball wert?",
          "offered": [
            "1",
            "2",
            "3",
            "4"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Kako se zove serija u kojoj su glavni likovi Monica, Ross i Rachel ?",
          "question_ger":"Wie heißt die Serie mit den Hauptfiguren Monica, Ross und Rachel ? ",
          "offered": [
            "Friends",
            "Breaking Bad",
            "Stanger Things",
            "Fight Club"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Što je bio Muhammad Ali?",
          "question_ger":"Was war Muhammad Ali ?",
          "offered": [
            "Boksač",
            "Nogometaš",
            "Košarkas",
            "Komičar"
          ],
          "offered_ger": [
            "Boxer",
            "Fußballer",
            "Basketballspieler",
            "Komiker"
          ],
          "answer": 0
        },
        {
          "question": "Koliko iznosi korjen broja 144?",
          "question_ger":"wie viel ist die Wurzel der Zahl 144 ?",
          "offered": [
            "11",
            "12",
            "13",
            "14"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Lucasfilm je napravio koji film?",
          "question_ger": "Lucasfilm hat welchen Film gemacht ?",
          "offered": [
            "Zvjezdani Ratovi",
            "Tko pjeva zlo ne misli",
            "Nemoguća misija",
            "Spiderman"
          ],
          "offered_ger": [
            "Star Wars",
            "Wer singt, denkt nicht böse",
            "Mission Impossible",
            "Spiderman"
          ],
          "answer": 0
        },
        {
          "question": " Riječ dinosauria dolazi iz grčkog, a znači što?",
          "question_ger":"Das Wort Dinosaurier kommt aus den Griechischen, und bedeutet was ?",
          "offered": [
            "Veliki zmaj",
            "Strašni gušter",
            "Divovska nakaza",
            "Veliki gmaz"
          ],
          "offered_ger": [
            "großer Drache",
            "furchtseuchende Eidechse",
            "Riesenfreak",
            "großes Reptil"
          ],
          "answer": 1
        },
        {
          "question": "Poslije riječi 'ok', koja je druga najpoznatija riječ na svijetu?",
          "question_ger":"Nach dem Wort 'ok', welches andere Wort ist das beruhmteste in der Welt ?",
          "offered": [
            "Coca-cola",
            "America",
            "Adidas",
            "McDonald's"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Koja vjera prevladava na Filipinima?",
          "question_ger":"Welcher Glaube herscht auf den Philippinen vor ?",
          "offered": [
            "Krščanstvo",
            "Budizam",
            "Islam",
            "Ateizam"
          ],
          "offered_ger": [
            "Christentum",
            "Buddhismus",
            "Islam",
            "Atheismus"
          ],
          "answer": 0
        },
        {
          "question": "Koja je od navedenih najmnogoljudina zemlja na svijetu?",
          "question_ger":"Welches von aufgeführten Länder ist das kleinste Land?",
          "offered": [
            "Indija",
            "Amerika",
            "Rusija",
            "Kanada"
          ],
          "offered_ger": [
            "Indien",
            "Amerika",
            "Russland",
            "Kanada"
          ],
          "answer": 0
        },
        {
          "question": "Koje se boja nalazi najmanje na zastavi Bosne i Hercegovine?",
          "question_ger":"Welche Farbe befindet sich am wenigsten auf der Flagge von Bosnien und Herzegovina ?",
          "offered": [
            "Plave",
            "Žute",
            "Crvene",
            "Bijele"
          ],
          "offered_ger": [
            "Blaue",
            "Gelbe",
            "Rote",
            "Weiße"
          ],
          "answer": 2
        },
        {
          "question": "Koju oznaku nosi ruski avion pete generacije?",
          "question_ger": "Welche Bezeichnung trägt das russische Flugzeug der fünften Generation?",
          "offered": [
            "Suhoj Su-57",
            "Ribik S-55",
            "Gene G-5",
            "Moskva G-5"
          ],
          "offered_ger": [
            "Su-57",
            "RIBIKS S-55",
            "GEN G-5",
            "MOSKAU G-5"
          ],
          "answer": 0
        },
        {
          "question": "Koju boju nema zastava Rusije?",
          "question_ger":"Welche Farbe hat die russische Flagge nicht ?",
          "offered": [
            "Zelenu",
            "Plavu",
            "Crvenu",
            "Bijelu"
          ],
          "offered_ger": [
            "Grün",
            "Blau",
            "Rot",
            "Weiß"
          ],
          "answer": 0
        },
        {
          "question": "Koji je zadnji troznamenkasti broj djeljiv s 6?",
          "question_ger":"Welche letzte dreistellige Zahl ist teilbar mit der 6? ",
          "offered": [
            "999",
            "996",
            "994",
            "998"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Koja od ovih životinja je najmanja?",
          "question_ger":"Welches von diesen Tieren ist das kleinste ?",
          "offered": [
            "Puma",
            "Pauk",
            "Tvor",
            "Majmun"
          ],
          "offered_ger": [
            "Puma",
            "Spinne",
            "Skunk",
            "Affe"
          ],
          "answer": 1
        },
        {
          "question": "Izbacite uljeza ",
          "question_ger":"Werfen sie den Eindringling raus",
          "offered": [
            "Tipkovnica",
            "Miš",
            "Slušalice",
            "Mikrofon"
          ],
          "offered_ger": [
            "Tastatur",
            "Maus",
            "Kopfhorer",
            "Mikrofon"
          ],
          "answer": 2
        },
        {
          "question": "Gdje se nalazimo ako smo u Central Parku?",
          "question_ger": "Wo befinden wir uns wenn wir im Central Park sind ?",
          "offered": [
            "New York",
            "Berlin",
            "Paris",
            "Washington"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        }
      ]
    },
    2:{
      "questions":[
        {
          "question": "Od koliko se mišića sastoji ljudsko tijelo?",
          "question_ger":"Aus wie vielen Muskel setzt sich ein menschlicher Körper zusammen?.",
          "offered": [
            "752",
            "798",
            "812",
            "892"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Tko je tvorac poznate jurišne puške AK-47?",
          "question_ger":"Wer ist der Schöpfer des bekannten Sturmgewehrs AK-47 ?",
          "offered": [
            "Aleksandr Kalašnjikov",
            "Mihail Kalašnjikov",
            "Danil Kalašnjikov",
            "Antionij Kalašnjikov"
          ],
          "offered_ger": [
            "Alexader Kalaschnikow",
            "Michail Kalaschnikow",
            "Danil Kalaschnikow",
            "Antionia Kalaschnikow"
          ],
          "answer": 1
        },
        {
          "question": "U periodnom sustavu elemenata kojih elemenata ima najviše?",
          "question_ger":"In dem periodischen System der Elemente , welche Elemente gibt es am meisten",
          "offered": [
            "Zametala",
            "Nemetala",
            "Polumetala",
            "Metala"
          ],
          "offered_ger": [
            "Zametal",
            "Nemetal",
            "Semimetal",
            "Metal"
          ],
          "answer": 3
        },
        {
          "question": "Koje je godine Einstein opisao teoriju relativnosti?",
          "question_ger":"Im welchen Jahr hat Einstein die Relativitätstheorie beschrieben ?",
          "offered": [
            "1896",
            "1908",
            "1916",
            "1924"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Što od navedenog spada u voće?",
          "question_ger":"Was von Angegebenen gehört zum Obst",
          "offered": [
            "Lubenica",
            "Rajčica",
            "Bundeva",
            "Mrkva"
          ],
          "offered_ger": [
            "Wassermelone",
            "Tomate",
            "Kurbis",
            "Karotte"
          ],
          "answer": 1
        },
        {
          "question": "Koliko iznosi konstanta pi zaokružena na 4 decimalna mjesta?",
          "question_ger":"Wie viel ist Pi-Konstanta gerundet auf 4 Dezimalstellen",
          "offered": [
            "3,1416",
            "3,1415",
            "3,1414",
            "3,1413"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Koja je najveća pustinja na svijetu?",
          "question_ger":"Welche Wüste ist die größte in der Welt",
          "offered": [
            "Sahara",
            "Gobi",
            "Antarktik",
            "Kalahari"
          ],
          "offered_ger": [
            "Sahara",
            "Gobi",
            "Antarktische Wüste",
            "Kalahari"
          ],
          "answer": 2
        },
        {
          "question": "Koliko iznosi dubina Marijanske brazde?",
          "question_ger":"Wie viel ist die Tiefe von Marianengraben?",
          "offered": [
            "11 km",
            "8,5 km",
            "12,2 km ",
            "14,8 km"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Koji od navedenih nije Saturnov prirodni satelit?",
          "question_ger":"Welcher von angegebenen ist nicht Saturns naturlicher Satellit",
          "offered": [
            "Janus",
            "Prometej",
            "Titan",
            "Kalista"
          ],
          "offered_ger": [
            "Janus",
            "Prometheus",
            "Titan",
            "Callist"
          ],
          "answer": 3
        },
        {
          "question": "Tko je žrtva atentata koji je izvršio Gavrilo Princip, član organizacije 'Mlada Bosna'?",
          "question_ger":"Wer ist das Opfer eines Attentats das Gavrilo Princip verübte,er ist das Organisationsmiedglied von 'JUNGE BOSNIEN' ",
          "offered": [
            "Aleksandar Obrenović",
            "Petar I. Karađorđević",
            "Muhamed Mehmedbašić",
            "Franjo Ferdinand"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 3
        },
        {
          "question": "U kojem mjesecu čikaški vodoinstalateri tradicionalno oboje rijeku Chicago u zeleno?",
          "question_ger":"Im welchen Monat haben Klempner in Chicago, traditionell den Fluss Chicago in grün bemahlen?  ",
          "offered": [
            "U veljači",
            "U ožujku",
            "U travnju",
            "U rujnu"
          ],
          "offered_ger": [
            "im Februar",
            "im März",
            "im April",
            "im September"
          ],
          "answer": 1
        },
        {
          "question": "Iako će se u budućnosti smanjiti, više od 70% mase današnjeg Sunca je...",
          "question_ger":"Obwohl er sich in der Zukunft verkleinert, mehr als 70%  der Masse heutiger Sonne ist ?",
          "offered": [
            "Helij",
            "Kisik",
            "Vodik",
            "Fosfor"
          ],
          "offered_ger": [
            "Helium",
            "Sauerstoff",
            "Wasserstoff",
            "Phosphor"
          ],
          "answer": 2
        },
        {
          "question": "Dimenzije košarkaškog terena u NBA ligi iznose ...",
          "question_ger":"Abmessungen des Basketballplatzes in der NBA-Liga betragen ",
          "offered": [
            "20 m x 17 m",
            "24 m x 22 m",
            "29 m x 17 m",
            "29 m x 15 m"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 3
        },
        {
          "question": "Aligatorska kruška je drugo ime za koje voće?",
          "question_ger":"Aligatorbirne ist der zweite Name fur welches Obst ? ",
          "offered": [
            "Dinju",
            "Bananu",
            "Patlidžan",
            "Avokado"
          ],
          "offered_ger": [
            "Melone",
            "Banane",
            "Aubergine",
            "Avocado"
          ],
          "answer": 3
        },
        {
          "question": "Originalno ime krumpirove zlatice u imenu sadrži ime koje države?",
          "question_ger":"Originalname von Kartoffelgold enthält im Namen den Namen von welchem Land ?",
          "offered": [
            "Colorado",
            "Georgia",
            "Iowa",
            "Ohio"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Registarska oznaka 'S' označava koju državu?",
          "question_ger":"Nummerschild S gibt welches Land an ' ",
          "offered": [
            "Švicarsku",
            "Šri Lanku",
            "Švedsku",
            "Španjolsku"
          ],
          "offered_ger": [
            "Schweiz",
            "Sri Lanka",
            "Schweden",
            "Spanien"
          ],
          "answer": 2
        },
        {
          "question": "Kako se zove mitološko čudovište u kojem su sjedinjeni lav i orao?",
          "question_ger":"Wie heißt das mythologische Monster in dem Lowe und Adler vereint sind ?  ",
          "offered": [
            "Jednorog",
            "Grifon",
            "Minotaur",
            "Eaglion"
          ],
          "offered_ger": [
            "Einhorn",
            "Griffin",
            "Minotaur",
            "Eaglion"
          ],
          "answer": 1
        },
        {
          "question": "Tko je bio prvi čovjek koji je nogom stupio na sve kontinente osim Antarktike?",
          "question_ger":"Wer war der erste Mann der alle Kontinenten mit dem Fuß betrat ausser Antarktis ?",
          "offered": [
            "Filip IV",
            "James Cook",
            "Christopher Columbo",
            "Magellan"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Gdje se nalazi labirint u ljudskom tijelu?",
          "question_ger":"Wo befindet sich das Labyrinth im menschlichen Körper",
          "offered": [
            "U uhu",
            "U nosu",
            "U mozgu",
            "U plućima"
          ],
          "offered_ger": [
            "im Ohr",
            "in der Nase",
            "im Gehirn",
            "in der Lunge"
          ],
          "answer": 0
        },
        {
          "question": "Što je bio Kafkin Gregor Samsa prije nego se preobrazio u kukca?",
          "question_ger":"Was wahr Kafkin Gregor Samsa bevor er sich in einen Insekt verwandelt hat ?",
          "offered": [
            "Trgovački putnik",
            "Turistički agent",
            "Vozač taksija",
            "Ulični čistač"
          ],
          "offered_ger": [
            "gewerblicher Passagier",
            "Handelsvertreter",
            "Taxifahrer",
            "Strassenreiniger"
          ],
          "answer": 0
        },
        {
          "question": "Kako se zove osoba koja jezično-stilski uređuje rukopis?",
          "question_ger":"Wie heißt die Person die sprachlich-stillvoll eine Handschrift bearbeitet ?",
          "offered": [
            "Recenzent",
            "Urednik",
            "Mentor",
            "Lektor"
          ],
          "offered_ger": [
            "Rezensent",
            "Editor",
            "Mentor",
            "Lecter"
          ],
          "answer": 3
        },
        {
          "question": "Kako se zove sporazum između svjetovne i crkvene vlasti?",
          "question_ger":"Wie heißt die Vereinbarung zwischen weltlicher und kirchlicher Regierung ?",
          "offered": [
            "Sabor",
            "Konkordat",
            "Povelja",
            "Koncil"
          ],
          "offered_ger": [
            "Parlament",
            "Konkordat",
            "Charta",
            "Koncil"
          ],
          "answer": 1
        },
        {
          "question": "Tko je ne samo Edipova sestra nego i rođena kći?",
          "question_ger":"Wer ist nicht nur Odipus Schwester sonder auch seine geborene Tochter ? ",
          "offered": [
            "Antigona",
            "Domenika",
            "Helena",
            "Julija"
          ],
          "offered_ger": [
            "Antigone",
            "...",
            "...",
            "Julia"
          ],
          "answer": 0
        },
        {
          "question": "Glazbalo u kojem tonove stvaraju batići, pločice, cijevi, propeleri i cvjetići?",
          "question_ger":"Ein Instrument in dem Tone von Trommelnstücken, Fliesen,Rohren, Propellern und Blümchen erzeugt werden",
          "offered": [
            "Vibrafon",
            "Ksiolofon",
            "Činele",
            "Klavir"
          ],
          "offered_ger": [
            "",
            "",
            "",
            ""
          ],
          "answer": 0
        },
        {
          "question": "Cordelia, Regan i Goneril kćeri su kojeg kralja?",
          "question_ger":"Cordelia Regan und Goneril sind Töchter von welchem König?",
          "offered": [
            "Leara",
            "Arthura",
            "Filipa",
            "Karla"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Kako se zove carinik kojeg je Isus pozvao za učenika i koji je kasnije postao evanđelist?",
          "question_ger":"Wie heißt der Publizist den Jesus eingeladen hat als Schüler und später wurde er Evangelist ? ",
          "offered": [
            "Marko",
            "Matej",
            "Ivan",
            "Luka"
          ],
          "offered_ger": [
            "Mark",
            "Matthew",
            "Ivan",
            "Luka"
          ],
          "answer": 1
        },
        {
          "question": "Koju životinju je najčešće prikazivala minojska umjetnost na Kreti?",
          "question_ger":"Welches Tier wurde am häufigsten angezeigt in der Minjon-Kunst auf Kreta ?",
          "offered": [
            "Lava",
            "Bika",
            "Noja",
            "Tigra"
          ],
          "offered_ger": [
            "Löwe",
            "Stier",
            "Strauß",
            "Tiger"
          ],
          "answer": 1
        },
        {
          "question": "Koji je revolver nedjeljiv od prljavog Harryja?",
          "question_ger":"Welche Waffe ist nicht teilbar von Dirty Harry",
          "offered": [
            "Colt 45",
            "Magnum 44",
            "Glock 9mm",
            "Deagle 50cal."
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Koji se blagdan u Sjedinjenim Američkim Državama slavi 4. srpnja?",
          "question_ger":"Welcher Festtag wird in den Vereinigten Staaten von Amerika am 4. Juli gefeiert ?",
          "offered": [
            "Dan nezavisnosti",
            "Dan zahvalnosti",
            "Noć vještica",
            "Uskrs"
          ],
          "offered_ger": [
            "Unabhangigkeitstag",
            "Erntedankfest",
            "Haloween",
            "Ostern"
          ],
          "answer": 0
        },
        {
          "question": "Koja se znanstvena disciplina bavi artikulacijom i fiziološkim osobinama glasova?",
          "question_ger":"Welche wissenschaftliche Disziplin beschäftigt sich mit Artikulation und physiologischen Eigenschaften der Stimmen ? ",
          "offered": [
            "Fonetika",
            "Akustika",
            "Polemika",
            "Morfologija"
          ],
          "offered_ger": [
            "Phonetik",
            "Akustik",
            "Kontroverse",
            "Morphologie"
          ],
          "answer": 0
        },
        {
          "question": "Tko je skladao čuvenu klavirsku sonatu u Cis duru nazvanu Mjesečeva sonata?",
          "question_ger":"Wer hat die berühmte Klaviersonate in Cis dur Mondsonate genannt komponiert?",
          "offered": [
            "Beethoven",
            "Bach",
            "Mozart",
            "Haydn"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Koji je najduži planinski lanac na Zemlji?",
          "question_ger":"Welche Bergkette ist die längste auf der Erde?",
          "offered": [
            "Himalaja",
            "Kavkasko gorje",
            "Ande",
            "Alpe"
          ],
          "offered_ger": [
            "Himalaya",
            "Kaukasus Gebirge",
            "Andes",
            "Alpen"
          ],
          "answer": 2
        },
        {
          "question": "Koji je kemijski element nakon kisika najrašireniji u Zemljinoj kori?",
          "question_ger":"Welches Chemische Element ist nach Sauerstoff am weitesten verbreitet in der Erdkruste ?  ",
          "offered": [
            "Zlato",
            "Vodik",
            "Silicij",
            "Bakar"
          ],
          "offered_ger": [
            "Gold",
            "Wasserstoff",
            "Silizium",
            "Kupfer"
          ],
          "answer": 2
        },
        {
          "question": "U kojem je talijanskom gradu prvi puta zamirisala pizza?",
          "question_ger":"In welcher Italienischer Stadt roch die Pizza zum ersten Mal ? ",
          "offered": [
            "Genovi",
            "Milanu",
            "Napulju",
            "Rimu"
          ],
          "offered_ger": [
            "Genua",
            "Milan",
            "Napoli",
            "Rom"
          ],
          "answer": 2
        },
        {
          "question": "Kako se zove obredno samoubojstvo japanskih samuraja?",
          "question_ger":"Wie heißt der rituelle Selbstmord japanischer Samurai?",
          "offered": [
            "Seppuku",
            "Hiragana",
            "Kojoshi",
            "Mordoshi"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Koje od navedenog nije programski jezik već knjiga?",
          "question_ger":"Welche der genannten ist keine Programmiersprache sondern ein Buch ?",
          "offered": [
            "Java",
            "C",
            "JavaScript",
            "NightScript"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 3
        },
        {
          "question": "Ako krivo odgovorimo na 13. pitanje s kojim iznosom 'idemo kući'?",
          "question_ger":"...Wenn wir falsch auf die 13 Frage antworten mit welcher Summe gehen wir nach Hause ?",
          "offered": [
            "250.000 kn",
            "125.000 kn",
            "64.000 kn",
            "32.000 kn"
          ],
          "offered_ger": [
            "250.000 €",
            "125.000 €",
            "64.000 €",
            "32.000 €"
          ],
          "answer": 3
        },
        {
          "question": "Koje slovo isto pišemo i na latinici i čirilici?",
          "question_ger":"Welchen Buchstaben schreiben wir gleich in Lateinisch und Kyrillisch",
          "offered": [
            "A",
            "B",
            "L",
            "P"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Koje je jezero najveće?",
          "question_ger":"Welcher See ist der größte",
          "offered": [
            "Kaspijsko",
            "Vransko",
            "Crno",
            "Crveno"
          ],
          "offered_ger": [
            "Caspian-See",
            "Vrana-See",
            "Schwarzer See",
            "Roter See"
          ],
          "answer": 0
        },
        {
          "question": "Koji je glavni grad Rusije?",
          "question_ger":"Wie heißt die Hauptstadt von Russland ? ",
          "offered": [
            "Kijev",
            "Volgograd",
            "Moskva",
            "Kolol"
          ],
          "offered_ger": [
            "Kiev",
            "Wolgograd",
            "Moskau",
            "Kolol"
          ],
          "answer": 2
        },
        {
          "question": "Ateroskleroza je bolest čega?",
          "question_ger":"Atherosklerose ist eine Krankheit von ? ",
          "offered": [
            "Mozga",
            "Kostiju",
            "Krvnih žila",
            "Jetre"
          ],
          "offered_ger": [
            "Gehirn",
            "Knochen",
            "Blutgefäßen",
            "Leber"
          ],
          "answer": 2
        },
        {
          "question": "Maat Mons, najveći vulkan visine od 8km nalazi se na kojoj planeti?",
          "question_ger":"Maat Mons der größter Vulkan mit einer Höhe von 8 km befindet sich auf welchem Planet",
          "offered": [
            "Merkur",
            "Venera",
            "Mars",
            "Jupiter"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Koji je od navedenih klubova osvojio Ligu prvaka 2008 godine?",
          "question_ger":"Welcher vom genannten Verein hat die Champions-League im Jahr 2008 gewonnen?",
          "offered": [
            "FC Barcelona",
            "AC Milan",
            "FC Manchester United",
            "FC Chelsea"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Koliko je Isusu bilo godina kada je umro?",
          "question_ger":"Wie alt war Jesus als er gestorben ist ?",
          "offered": [
            "Oko 24",
            "Oko 27",
            "Oko 33",
            "Oko 41"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Po čemu je Argentina dobila ime?",
          "question_ger":"Nach was wurde Argentinien benannt ?",
          "offered": [
            "Boji",
            "Metalu",
            "Biljci",
            "Životinji"
          ],
          "offered_ger": [
            "Farbe",
            "Metal",
            "Pflanze",
            "Tier"
          ],
          "answer": 1
        },
        {
          "question": "Ako je Poseidon štovan kod grka, tko je istu ulogu imao kod rimljanja?",
          "question_ger":"Wenn Poseidon von den Griechen repektiert würde, wer hat die gleiche Rolle bei den Römer ? ",
          "offered": [
            "Ares",
            "Saturn",
            "Neptun ",
            "Kronos"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Koje je godine potonuo slavni Titanic?",
          "question_ger":"Im welchen Jahr versenkte der berühmte Titanic ?",
          "offered": [
            "1910",
            "1911",
            "1912",
            "1913"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Koliko je kćeri imao Otac Goriot?",
          "question_ger":"Wie viele Töchter hatte Pater Goriot ?",
          "offered": [
            "1",
            "2",
            "3",
            "4"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Nastavite niz: 11, 13, 17, 19 ...",
          "question_ger":"Setzen sie die Serie fort 11, 13, 17,19 ...",
          "offered": [
            "21",
            "23",
            "27",
            "31"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        }
      ]
    },
    3:{
      "questions":[
        {
          "question": "Što predstavlja produžetak citoplazme živčane stanice?",
          "question_ger":"Was präsentiert eine Erweiterung der Zytoplasmas Nervenzellen ?  ",
          "offered": [
            "Dendriti",
            "Akson",
            "Mijelinska ovojnica",
            "Soma"
          ],
          "offered_ger": [
            "Dendriten",
            "Axon",
            "Myelinische Mantelnervenzellen",
            "Soma"
          ],
          "answer": 1
        },
        {
          "question": "Kakve brojeve predstavlja slovo 'Z' u matematici?",
          "question_ger":"Welche Zahlen stellt der Buchstabe 'Z' in Mathematik dar ?",
          "offered": [
            "Prirodne",
            "Realne",
            "Iracionalne",
            "Cijele"
          ],
          "offered_ger": [
            "Natürliche",
            "Realistische",
            "Irrational",
            "Ganze"
          ],
          "answer": 3
        },
        {
          "question": "Koji tenisač je osvojio Australian Open čak 7 puta od 2011. godine do 2020. godine?",
          "question_ger":"Welcher Tennisspieler hat Australian Open sogar 7 mal vom Jahr 2011 bis 2020 gewonnen ",
          "offered": [
            "Rafael Nadal",
            "Roger Federer",
            "Novak Đoković",
            "Andy Murray"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Koji od navedenih glumaca nema Oskara za najboljeg glavnog glumca?",
          "question_ger":"Welcher von genannten Schauspieler hat keinen Oskar fur den besten Haupdarsteller ?",
          "offered": [
            "Tom Hanks",
            "Brad Pitt",
            "Leonardo DiCaprio",
            "Nicolas Cage"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Ako koristimo vozilo od 100 KW, koliko to vozila ima konjskih snaga?",
          "question_ger":"Wenn wir ein Fahrzeug von 100 KW benutzen, wie viel PS hat dieses Fahrzeug ?",
          "offered": [
            "134",
            "165",
            "65",
            "34"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Što se nalazi u stanicama svih živih bića koja obavljaju fotosintezu?",
          "question_ger":"Was befindet sich in den Zellen aller Lebewesen die eine Photosynthese durchfuhren ?",
          "offered": [
            "Eritrociti",
            "Neutrofili",
            "Fosfil",
            "Klorofil"
          ],
          "offered_ger": [
            "Erythrovokate",
            "Neutrophile",
            "Phosphilen",
            "Chlorophyll"
          ],
          "answer": 3
        },
        {
          "question": "Kojoj od navedenih tvrtki Elon Musk nikada nije bio vlasnik?",
          "question_ger":"Welchem Unternehmen war Elon Musk niemals der Besitzer ?",
          "offered": [
            "PayPal",
            "Zip2",
            "Tesla Motors",
            "AirSpace"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 3
        },
        {
          "question": "Tko konstruirao i napravio prvi automobil?",
          "question_ger":"Wer hat das erste Auto konstruiert und gemacht?",
          "offered": [
            "Karl Benz",
            "Rudolf Diesel",
            "Thomas Alva Edison",
            "Robert Koch"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Mirmekologija je znanost o čemu?",
          "question_ger":"Mirmekologie ist eine Wissenschaft uber was ?",
          "offered": [
            "Mravima",
            "Leptirima",
            "Bubama",
            "Pčelama"
          ],
          "offered_ger": [
            "Ameisen",
            "Schmeterlinge",
            "Kafer",
            "Bienen"
          ],
          "answer": 0
        },
        {
          "question": "Crna Smrt je naziv za koju bolest?",
          "question_ger":"Schwarzer Tod ist der Name fur welche Krankheit ?",
          "offered": [
            "Velike boginje",
            "Kuga",
            "Sifilis",
            "HIV"
          ],
          "offered_ger": [
            "Pocken",
            "Pest",
            "Syphilis",
            "HIV"
          ],
          "answer": 1
        },
        {
          "question": "Najsjevernija točka Europe je...",
          "question_ger":"Der nordlichste Punkt Europas ist ?",
          "offered": [
            "Tarifa",
            "Cape Agulhas",
            "Bloemfontein",
            "Nordkapp"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 3
        },
        {
          "question": " Tko je Zeusov i Herin sin, bog rata, simbol hrabrosti, silovitosti i junačke snage?",
          "question_ger":"Wer ist der Sohn von Zeus und Hera, Symbol für Mut, Kraft und heldenhafte Stärke ?",
          "offered": [
            "Had",
            "Hefest",
            "Ares",
            "Posejdon "
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Leonardo da Vinci - Mona Lisa, Shakespeare - Hamlet, Michelangelo - ...",
          "question_ger":"...",
          "offered": [
            "Posljednja večera",
            "Zvjezdana noć",
            "Strop Sikstinske kapele",
            "Iris"
          ],
          "offered_ger": [
         
            "das letzte Abendmahl",
            "Sternennacht",
            "Sixtinische Kapelle",
            "Iris"
          ],
          "answer": 2
        },
        {
          "question": "Batovinu, Gofa, Pagara i Šaraga zajedno zovemo...",
          "question_ger":"Batovina, Gofa, Pagar und Šagar werden zusammen genannt ?",
          "offered": [
            "Sisavci",
            "Ribe",
            "Ptice",
            "Insekti"
          ],
          "offered_ger": [
            "Saugetiere",
            "Fische",
            "Vogel",
            "Insekten"
          ],
          "answer": 1
        },
        {
          "question": "Na kojoj od navedenih temperatura je gustoća vode najveća?",
          "question_ger":"Auf welcher genannten Temperatur ist die Wasserdichte am größten ? ",
          "offered": [
            "- 273 C",
            "-30 C",
            "0 C",
            "100 C"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Koji je od navedenih brojeva najveći?",
          "question_ger":"Welche von genannten Zahlen ist die größte ?",
          "offered": [
            "CCI",
            "DDVI",
            "CXXXVI",
            "MMMXVI"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 3
        },
        {
          "question": "Koja je glazbena oznaka za brz tempo?",
          "question_ger":"...Welcher Musiklabel ist für schnelles Tempo ?",
          "offered": [
            "Allegro",
            "Adagio",
            "Moderato",
            "Largo"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Tko je bio predsjednik Sjedinjenih Država u doba kad je prvi čovjek stupio na Mjesec?",
          "question_ger":"Wer war der Präsident von Vereinigten Staaten in der Zeit wo der erste Mensch den Mond betrat ?",
          "offered": [
            "Nixon",
            "Bush",
            "Clinton",
            "Kennedy"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Kako se zove europska zemlja u kojoj su žene dobile prvo puno izborno pravo glasa?",
          "question_ger":"Wie heißt das Europäische Land wo Frauen zum ersten Mal ein Stimmrecht bekommen haben ?",
          "offered": [
            "Rusija",
            "Engleska",
            "Finska",
            "Nizozemska"
          ],
          "offered_ger": [
            "Russland",
            "England",
            "Finland",
            "Niederlande"
          ],
          "answer": 2
        },
        {
          "question": "Koliko godina mora navršiti konj da bi dobio naziv stari konj?",
          "question_ger":"Wie alt muss ein Pferd werden um Ihn als altes Pferd zu benennen ?",
          "offered": [
            "7 godina",
            "3 godine",
            "1 godinu",
            "5 godina"
          ],
          "offered_ger": [
            "7 Jahre",
            "3 Jahre",
            "1 Jahr",
            "5 Jahre"
          ],
          "answer": 0
        },
        {
          "question": "Od koga je Goran Ivanišević izgubio svoje prvo finale Wimbledona?",
          "question_ger":"Von wem hat Goran Ivanišević sein erstes Wimbledon Finale verloren ?",
          "offered": [
            "Od Federera",
            "Od Hewitta",
            "Od Agassija",
            "Od Raftera"
          ],   
          "offered_ger": [
            "von Federer",
            "von Hewitt",
            "von Agassi",
            "von Rafter"
          ],
          "answer": 2
        },
        {
          "question": "Što je Staljin bio po nacionalnosti?",
          "question_ger":"Was war Stalin nach Nationalität ?",
          "offered": [
            "Rus",
            "Ukrajinac",
            "Gruzijac",
            "Poljak"
          ],
          "offered_ger": [
            "Russe",
            "Ukraine",
            "Georgisch",
            "Pole"
          ],
          "answer": 2
        },
        {
          "question": "Koji se grad naziva Arhimedovim gradom?",
          "question_ger":"Welche Stadt wird Archimedes-City genannt ?",
          "offered": [
            "Sirakuza",
            "Babilon",
            "Harappa",
            "Mohenjo Daro"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Koliko je minuta Jurij Gagarin proveo u svemiru na svom prvom letu oko zemlje?",
          "question_ger":"Wie viele Minuten verbrachte Juri Gagarin im All bei seinem ersten Flug um die Erde ? ",
          "offered": [
            "35",
            "99",
            "108",
            "304"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Koja od navedenih životinja ne pripada pticama?",
          "question_ger":"Welches von genannten Tieren gehört nicht zu Vogeln ?",
          "offered": [
            "Noj",
            "Orao",
            "Gnu",
            "Djetlić"
          ],
          "offered_ger": [
            "Strauß",
            "Adler",
            "Wildemore",
            "Specht"
          ],
          "answer": 2
        },
        {
          "question": "Tko je dobio Nobelovu nagradu za otkriće zakona o fotoelektričnom učinku?",
          "question_ger":"Wer hat den Nobelpreis fur die Entdeckung des Gesetzes uber Photoelektrische Wirkung ?   .",
          "offered": [
            "Newton",
            "Einstein",
            "Volt",
            "Pascal"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Koji se europski glavni grad nalazi na zemljopisnoj širini New Yorka?",
          "question_ger":"Welche Europäische Haupstadt befindet sich auf dem Breitengrad von New York ? ",
          "offered": [
            "Milano",
            "Zagreb",
            "Pula",
            "Madrid"
          ],
          "offered_ger": [
            "Milan",
            "Zagreb",
            "Pula",
            "Madrid"
          ],
          "answer": 3
        },
        {
          "question": "Kako glasi drugo osobno ime nogometaša Diega Maradone?",
          "question_ger":"Wie lautet der zweite persöhnlicher Name von Diego Maradona ?",
          "offered": [
            "Armando",
            "Bautista",
            "Cruz",
            "Jose"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Tko je u biblijskoj priči bio bačen u lavlju jamu?",
          "question_ger":"Wer wurde in der biblischen Geschichte in die Löwengrube geworfen ? ",
          "offered": [
            "Marko",
            "Toma",
            "Juda",
            "Danijel"
          ],
          "offered_ger": [
            "Mark",
            "Toma",
            "Jura",
            "Daniel"
          ],
          "answer": 3
        },
        {
          "question": "Kako se zove jedini nogometaš koji je osvojio 3 lige prvaka s 3 različita kluba?",
          "question_ger":"Wie heißt der einzige Fußballer der 3 Mal die Champions - League mit 3 verschiedenen Vereinen gewonnen hat",
          "offered": [
            "Clarence Seedorf",
            "Zlatan Ibrahimović",
            "Johan Cruyff",
            "Diego Maradona"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Koja država ima najveći broj različitih klubova koji su osvojili ligu prvaka?",
          "question_ger":"Welches Land hat die größte Zahl verschiedener Vereine die die Champions-League gewonnen haben ?",
          "offered": [
            "Nizozemska",
            "Njemačka",
            "Španjolska",
            "Engleska"
          ],
          "offered_ger": [
            "Niederlande",
            "Deutschlan",
            "Spanien",
            "England"
          ],
          "answer": 3
        },
        {
          "question": "Kako se zove pločica koja spaja vrat i nožice kod bakteriofaga?",
          "question_ger":"Wie heißt die Platte die Hals und Bein am Bakteriophagen verbindet ?",
          "offered": [
            "Bazna",
            "Keramička",
            "Bazalna",
            "Bazaltna"
          ],
          "offered_ger": [
            "Grund",
            "Keramik",
            "Basal",
            "Basalt"
          ],
          "answer": 2
        },
        {
          "question": "Nastavite niz glavnih likova iz South Parka: Kyle, Stan, Eric...",
          "question_ger":"Setzen Sie eine Reihe von Hauptrollen aus dem South Park fort : Kyle,Stan,Eric .... ",
          "offered": [
            "Clyde",
            "Butters",
            "Kenny",
            "Tweek"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Tko nije glumio u filmu Titanik?",
          "question_ger":"Wer spielte nicht im Film Titanic ?",
          "offered": [
            "Kate Winslet",
            "Leonardo DiCaprio",
            "Billy Zane",
            "Danny DeVito"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 3
        },
        {
          "question": "Tko je napisao roman Ivanhoe?",
          "question_ger":"Wer schrieb den Roman Ivanhoe",
          "offered": [
            "Walter Scott",
            "Robert Burns",
            "Charles Dickens",
            "Danny DeVito"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Najčešći osvjač hrvatskog kupa je ?",
          "question_ger":"Der häufigste kroatische Pokalsieger ist ? ",
          "offered": [
            "Dinamo",
            "Hajduk",
            "Lokomotiva",
            "Osijek"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Ako 'napušemo' 1,8 promila, koliko zapravo imamo alkohola u krvi?",
          "question_ger":"Wenn wir 1,8 Promille aufblasen, wie viel Alkohol haben wir im Blut ?",
          "offered": [
            "0.18%",
            "0.018%",
            "1.8%",
            "18%"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Odakle je automobil Peugeot?",
          "question_ger":"Woher kommt das Auto Peugeot ?",
          "offered": [
            "Njemačka",
            "Španjolska",
            "Francuska",
            "Rusija"
          ],
          "offered_ger": [
            "Deutschland",
            "Spanien",
            "Frankreich",
            "Russland"
          ],
          "answer": 2
        },
        {
          "question": "Odakle su Beatlesi?",
          "question_ger":"Woher kommen die Beatles ?",
          "offered": [
            "Liverpool",
            "London",
            "Paris",
            "Monaco"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        }
      ]
    },
    4:{
      "questions":[
        {
          "question": "Tko je kao tinejdžer na Wengerov poziv na probu odgovorio da ne dolazi na audicije?",
          "question_ger":"Wer hat als ein Teenager auf Wengers ruf zur Probe geantwortet das er nicht zur Auditionen kommt ?",
          "offered": [
            "Mario Balotelli",
            "Cristiano Ronaldo",
            "Zlatan Ibrahimović",
            "Lionel Messi"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Koji se kraj prostire i izvan granica naše države?",
          "question_ger":"Welches Gebiet reicht uber die Grenze unseres Landes hinaus",
          "offered": [
            "Spačva",
            "Gacka",
            "Poljica",
            "Bukovica"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Što omeđuje Sjevernoekvatorska, Golfska i Kanarska struja?",
          "question_ger":" Was grenzt um Nordaquathorial, Golf und Kanarienstrom ?",
          "offered": [
            "Sargaško more",
            "Ohotsko more",
            "Laptevsko more",
            "Rossovo more"
          ],
          "offered_ger": [
            "Sargasso See",
            "Ohotsko See",
            "Laptew Meer",
            "Dewy See"
          ],
          "answer": 0
        },
        {
          "question": "U kojoj azijskoj ligi nogometaši Paykana igraju protiv Tractora?",
          "question_ger":"In welcher asiatischen Liga spielen die Fusballer Paykan gegen Tractor? ",
          "offered": [
            "Uzbekistanskoj",
            "Iranskoj",
            "Kazahstanskoj",
            "Indijskoj"
          ],
          "offered_ger": [
            "Usbegistan Liga",
            "Iranische Liga",
            "Kasahstan Liga",
            "Indien Liga"
          ],
          "answer": 1
        },
        {
          "question": "Koji film počinje okršajem Domorodaca i Mrtvih zečeva?",
          "question_ger":"Welcher Film beginnt mit einem Kampf der Eingeborenen und toten Hasen ?",
          "offered": [
            "Ratnici podzemlja",
            "Boje nasilja",
            "Generacija X",
            "Bande New Yorka"
          ],
          "offered_ger": [
            "Krieger der Unterwelt",
            "Farben der Gewalt",
            "Generation X",
            "Die Banden von New York"
          ],
          "answer": 3
        },
        {
          "question": "Mitohondrij je stanična organela kojih stanica?",
          "question_ger":"Mitochondriale ist eine Zellenorganelle welcher Zellen ?  ",
          "offered": [
            "Fuznih stanica",
            "Klorofilnih stanica",
            "Eukariotskih stanica",
            "Endocitoznih stanica"
          ],
          "offered_ger": [
            "Sicherungszellen",
            "Chlorophyllzellen",
            "Eukaryotische Zellen",
            "Endozytozenzellen"
          ],
          "answer": 2
        },
        {
          "question": "Koji je predzadnji, najviši sloj Zemljine atmosfere?",
          "question_ger":"Welche Schicht ist die vorletzte und größte der Erdatmosphare ?",
          "offered": [
            "Egzosfera",
            "Termosfera",
            "Mezosfera",
            "Stratosfera"
          ],
          "offered_ger": [
            "Exosphare",
            "Termosphare",
            "Mesosphare",
            "Stratosphare"
          ],
          "answer": 1
        },
        {
          "question": "Koja je najveća dopuštena brzina kretanja na našim autocestama?",
          "question_ger":"Welche ist die größte erlaubte Geschwindigkeit der Bewegung auf unseren Autobahnen",
          "offered": [
            "27 m/s",
            "30 m/s",
            "33 m/s",
            "36 m/s"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 3
        },
        {
          "question": "Koji se metal 'ušuljao' u srce vitamina B12?",
          "question_ger":"Welches Metal hat sich eingeschliechen in das Herz von Vitamin B12 ?",
          "offered": [
            "Krom",
            "Nikal",
            "Kobalt",
            "Cink"
          ],
          "offered_ger": [
            "Chrom",
            "Nikal",
            "Kobalt",
            "Zink"
          ],
          "answer": 2
        },
        {
          "question": "Registarska oznaka 'RKS' označava koju državu?",
          "question_ger":"Das Kennzeichen RKS zeigt welches Land an",
          "offered": [
            "Kosovo",
            "Kazahstan",
            "Kambodža",
            "Kirgistan"
          ],
          "offered_ger": [
            "Kosovo",
            "Kazahstan",
            "Kambodscha",
            "Kirgisistan"
          ],
          "answer": 0
        },
        {
          "question": "Koja je najvažnija žlijezda s unutarnjim lučenjem?",
          "question_ger":"Welche ist die wichtigste Drüse mit interne Sekretion",
          "offered": [
            "Hipofiza",
            "Gušterača",
            "Hipotalamusa",
            "Melatonin"
          ],
          "offered_ger": [
            "Hypophyse",
            "Eidechse",
            "Hypothalamus",
            "Melatonin"
          ],
          "answer": 0
        },
        {
          "question": "Koja tvrtka je izbacila prvu igru za konzole?",
          "question_ger":"Welches Unternehmen hat die erste Spielkonsole ausgeworfen ?  ",
          "offered": [
            "Atari",
            "Sony",
            "Game Boy",
            "Pure Games"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Kako se zove troglavi pas koji prema grčkom mitu čuva ulaz u podzemni svijet?",
          "question_ger":"Wie heißt der dreiköpfige Hund der nach dem griechischem Mytos den Eingang zur Unterwelt bewährt ?",
          "offered": [
            "Kronos",
            "Kerber",
            "Gaudia",
            "Brutus"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Koji je francuski grad prvi do Pariza po broju stanovnika?",
          "question_ger":"Welche Stadt in Frankreich ist die erste nach Paris mit der größten Anzahl der Bevölkerung ?",
          "offered": [
            "Touluse",
            "Marsealle",
            "Lyon",
            "Berthran"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Koje je more najveće na svijetu?",
          "question_ger":"Welches Meer ist das größte in der Welt",
          "offered": [
            "Sredozemno",
            "Karipsko",
            "Japansko",
            "Indijsko"
          ],
          "offered_ger": [
            "Mittelmeer",
            "Karibisches Meer",
            "Japanisches",
            "Indisches"
          ],
          "answer": 0
        },
        {
          "question": "Koji trostavačni glazbeni komad spaja Brandenburga i Bacha?",
          "question_ger":"Welches dreistelliges Musikstück verbindet Brandenburg und Bach ? ",
          "offered": [
            "Koncert",
            "Sonata",
            "Kantata",
            "Fuga"
          ],
          "offered_ger": [
            "Konzert",
            "Sonate",
            "Kantate",
            "Fuge"
          ],
          "answer": 0
        },
        {
          "question": "Koji je starozavjetni prorok tri dana proveo u kitovoj utrobi?",
          "question_ger":"Welcher Alttestamentlicher Prophet hat drei Tage im Darm von einem Hai verbracht ?",
          "offered": [
            "Jona",
            "Jošua",
            "Jonatan",
            "Jišaj"
          ],
          "offered_ger": [
            "Jona",
            "Joshua",
            "Jonathan",
            "Yishaj"
          ],
          "answer": 0
        },
        {
          "question": "Gdje je odapeta plamena strijela upalila olimpijski plamen?",
          "question_ger":"Wo hat das flammende Pfeil die Olympische Flamme angezündet ?",
          "offered": [
            " Barcelona 1992",
            " Barcelona 1993",
            " Barcelona 1995",
            " Barcelona 1998"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Koji šahovski kralj je najduže bio na tronu svjetskog prvaka?",
          "question_ger":"Welcher König des Schachs war am langsten auf dem Thron des Weltmeisters ",
          "offered": [
            "Blue Gene",
            "Emanuel Lasker",
            "Gary Kasparov",
            "George Lasquet"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Tko je skladao glazbu koja prati karakteristični hod Pinka Panthera?",
          "question_ger":"Wer hat die Musik komponiert die den charakteristischen Gang von Pink Panther begleitet.",
          "offered": [
            "Henry Mancini",
            "Bob Ford",
            "James Luzon",
            "Henry Simonija"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Što radite kad pokrećete mandibulu?",
          "question_ger":"Was machen sie wenn sie die Mandible starten ?",
          "offered": [
            "Blinken",
            "Kauen",
            "Atmen",
            "Ohren bewegen"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Kada i gdje se odbojka prvi put pojavljuje na olimpijskim igrama?",
          "question_ger":"Wann und wo erscheint Volleyball auf den Olympischen Spielen zum ersten Mal ? ",
          "offered": [
            "1952 Helsinki",
            "1956 Melbourne",
            "1960 Rim",
            "1964 Tokio"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 3
        },
        {
          "question": "Kako se zvao pomorac koji je prvi dospio pomorskim putem iz Europe u Indiju?",
          "question_ger":"Wie hieß der Seemann der als erster uber Seewege aus Europa Indien erreicht hat ?",
          "offered": [
            "Amerigo Vespuci",
            "Vasco de Gama",
            "Ferdinand Magellan",
            "James Cook"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Koliko iznosi jedan AU (astronomska jedinica)?",
          "question_ger":"Wie viel ist eine AU ( Astronomische Einheit) ? ",
          "offered": [
            "150 milijuna kilometara",
            "50 milijuna kilometara",
            "250 milijuna kilometara",
            "500 milijuna kilometara"
          ],
          "offered_ger": [
            "150 Millionen Kilometer",
            "50 Millionen Kilometer",
            "250 Millionen Kilometer",
            "500 Millionen Kilometer"
          ],
          "answer": 0
        },
        {
          "question": "Koji je kemijski simbol Talija ? ",
          "question_ger":"Welches chemisches Symbol ist für Talia",
          "offered": [
            "Ta",
            "TI",
            "Tt",
            "Tm"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 1
        },
        {
          "question": "Tko je osnivač Islama?",
          "question_ger":"Wer ist der Gründer vom Islam",
          "offered": [
            "Muhamed",
            "Isus",
            "Aron",
            "Medin"
          ],
          "offered_ger": [
            "Muhamed",
            "Jesus",
            "Aron",
            "Medin"
          ],
          "answer": 0
        },
        {
          "question": "U kojem se gradu rodio Cristiano Ronaldo?",
          "question_ger":"In welcher Stadt wurde Christiano Ronaldo geboren ? ",
          "offered": [
            "Funchal",
            "Porto",
            "Lisabonu",
            "Beridela"
          ],
          "offered_ger": [
            "Funchal",
            "Porto",
            "Lisabon",
            "Beridela"
          ],
          "answer": 0
        },
        {
          "question": "Koja je najveća država Afrike?",
          "question_ger":"Das größte Land in Afrika ist ?",
          "offered": [
            "Nigerija",
            "Alžir",
            "Egipat",
            "JAR"
          ],
          "offered_ger": [
            "Nigerien",
            "Algerien",
            "Egypten",
            "JAR"
          ],
          "answer": 1
        }
      ]
    },
    5:{
      "questions":[
        {
          "question": "Uz Tiroksin koji je drugi glavni hormon štitne žlijezde?",
          "question_ger":"Zu dem Thyroxin welcher ist der zweite Haupthormon der Schilddrüse ?",
          "offered": [
            "Globulin",
            "Trijodtironin",
            "Hipotireoidizam",
            "Hipertireoidizam"
          ],
          "offered_ger": [
            "Globulin",
            "Tridythyronin",
            "Hypothyreose",
            "Hyperthyreose"
          ],
          "answer": 1
        },
        {
          "question": "Američki brend cigareta Marlboro dobio je ime po ulici iz kojeg grada?",
          "question_ger":"Die amerikanische Zigarettenmarke Marlboro wurde nach den Namen welcher Stadt benannt ? ",
          "offered": [
            "Londona",
            "New Yorka",
            "Los Angelesa",
            "Manchestera"
          ],
          "answer": 0
        },
        {
          "question": "Čega je Kaliopa kao muza bila zastupnica u grčkoj mitologiji?",
          "question_ger":"Was für eine Darstellerin war Kaliope als Muse in der griechischen Mythologie ",
          "offered": [
            "Ljubavne poezije",
            "Epske poezije",
            "Lirske poezije",
            "Božanske poezije"
          ],
          "offered_ger": [
            "Liebe Poesie",
            "Erische poesie",
            "Lyrische Poesie",
            "Gottliche Poesie"
          ],
          "answer": 1
        },
        {
          "question": "Kako se zove stanje gdje se svjetlosne zrake ne lome jednako na svim meridijanima oka?",
          "question_ger":"Wie heißt der Zustand wo die Lichtstrahlen nicht gleich brechen auf allen Augen Meridianen?",
          "offered": [
            "Miopija",
            "Hiperopija",
            "Hiperstizam",
            "Astigmatizam"
          ],
          "offered_ger": [
            "Myopie",
            "Hyperopie",
            "Hyperstismus",
            "Astigmatismus"
          ],
          "answer": 3
        },
        {
          "question": "Tko je rođen 10. srpnja 1856. godine?",
          "question_ger":"Wer ist am 10. Juli 1856 geboren ? ",
          "offered": [
            "Nikola Tesla",
            "Thomas Alva Edison",
            "George Westinghouse",
            "Charles Darwin"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Koji je atomski broj sumpora?",
          "question_ger":"Wie lautet die Ordnungszahl des Schwefels ? ",
          "offered": [
            "12",
            "14",
            "16",
            "18"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Kako glasi puno ime i prezime izvršnog direktora tvrtke Apple Inc.?",
          "question_ger":"Wie lautet der vollständige Name vom Direktor Des Apple Inc. Unternehmen?",
          "offered": [
            "Steven Steve Jobs",
            "Steven David Jobs",
            "Steven Antionio Jobs",
            "Steven Paul Jobs"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 3
        },
        {
          "question": "Koji element svijetli ljubičastom bojom, ako se nalazi u visokonaponskom el. polju?",
          "question_ger":"Welches Element leuchtet in lila Farbe wenn es in einen Hochgespannten Feld ist?",
          "offered": [
            "Vodik",
            "Helij",
            "Kisik",
            "Dušik"
          ],
          "offered_ger": [
            "Wasserstoff",
            "Helium",
            "Sauerstoff",
            "Stickstoff"
          ],
          "answer": 3
        },
        {
          "question": "Kako se zove vitez crtača Harolda Rudolfa Fostera?",
          "question_ger":"Wie heißt der Ritter von dem Zeichner Harold Rudolf Foster?",
          "offered": [
            "Arthur",
            "Valiant",
            "Vilim osvajač",
            "Arthur II"
          ],
          "offered_ger": [
            "Arthur",
            "Valiant",
            "Vilim der Eroberer",
            "Arthur II"
          ],
          "answer": 1
        },
        {
          "question": "Koje se godine Arnold Schwarzenegger oprostio s bodybuildingom osvojivši Mr. Olympia?",
          "question_ger":"Im welchen Jahr hat sich Arnold Schwarzenegger mit Bodybuilding verabgeschiedet mit dem gewinnen von Mr.Olympia?",
          "offered": [
            "1974.",
            "1975.",
            "1977.",
            "1980."
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 3
        },
        {
          "question": "U kojem filmu se u 6 sati ujutro 6. dana u tjednu 6. mjeseca rodio Mali Sotona?",
          "question_ger":"In welchem Film ist um 6 Uhr morgens, am 6 Tag in der Woche,im 6 Monat der kleine Satan geboren?",
          "offered": [
            "Kamen",
            "Amen",
            "Omen",
            "Ramen"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Edgar Rice Burroughs proslavio se ako autor kojeg lika?",
          "question_ger":"Edgar Rice Burroughs wurde berühmt als Autor welchen Charakter ? ",
          "offered": [
            "Tarzana",
            "Indiane Jonesa",
            "Conana",
            "Ramba"
          ],
          "offered_ger": [
            "Tarzan",
            "Indiana Jones",
            "Conan",
            "Rambo"
          ],
          "answer": 0
        },
        {
          "question": "Koji je element u periodnom sustavu elemenata određen simbolom 'Md'?",
          "question_ger":"Welches Element im Periodischen System der Elemente ist durch das Symbol Md angegeben ?",
          "offered": [
            "Mendelevij",
            "Madonij",
            "Moskovij Dioksid",
            "Mandgan"
          ],
          "offered_ger": [
            "Mendelevius",
            "Madonna",
            "Moskovium-Dioxid",
            "Mandgan"
          ],
          "answer": 0
        },
        {
          "question": "Koja kiselina je jača i od stopostotne sumporne kiseline?",
          "question_ger":"Welche Säure ist stärker auch von der hundertprozentigen Schwefelsäure ?",
          "offered": [
            "Fluorosumporna",
            "Trikloroctena",
            "Oksalna",
            "Cijanovodična"
          ],
          "offered_ger": [
            "Fluor Schwefelhaltig",
            "Trichlor Essigsäure",
            "Oxale",
            "Cyanowater"
          ],
          "answer": 0
        },
        {
          "question": "Koja momčad u WRC-u 1994. je izbačena iz natjecanja zbog prevare?",
          "question_ger":"Welche Mannschaft in WRC 1994 wurde ausgewiesen aus dem Wettbewerb wegen Betrugs ? ",
          "offered": [
            "Subaru",
            "Mitshubishi",
            "Toyota",
            "Nissan"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 2
        },
        {
          "question": "Koji je brod potopio bojni brod Bismarck u bitci kod Danskog prolaza 27.5.1941.?",
          "question_ger":"Welches Schiff hat das Schlahtschiff Bismarck versunken im Kampf beim Dänischen Durchgang am 27 Mai 1941",
          "offered": [
            "Hood",
            "King George V",
            "Orion",
            "Dieds"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        },
        {
          "question": "Koji je peti najveći kontinent po veličini?",
          "question_ger":"Welches Kontinent ist das fünftgrößte?",
          "offered": [
            "Azija",
            "Antarktik ",
            "Afrika",
            "Europa"
          ],
          "offered_ger": [
            "Asien",
            "Antarktika",
            "Afrika",
            "Europa"
          ],
          "answer": 1
        },
        {
          "question": "Koliko zvijezda ima Čile na svojoj zastavi?",
          "question_ger":"Wie viel Sterne hat Chile auf seiner Flagge?",
          "offered": [
            "Nijednu",
            "Jednu",
            "Dve",
            "Tri"
          ],
          "offered_ger": [
            "Keine",
            "Eine",
            "Zwei",
            "Drei"
          ],
          "answer": 1
        },
        {
          "question": "Čija zastava ima Saladinovog orla u sredini ?",
          "question_ger":"Wessen Flagge hat Saladins/Quraisch Falke in der Mitte?",
          "offered": [
            "Egipat",
            "Kuba",
            "Korea",
            "Njemačka"
          ],
          "offered_ger": [
            "Egypt",
            "Kuba",
            "Korea",
            "Deutschland"
          ],
          "answer": 0
        },
        {
          "question": "Ako stajanjem nad nečim djelujemo silom od 125 N, koliko kilograma imamo?",
          "question_ger":"Wenn wir stehend uber etwas mit Gewalt handeln von 125 N, wie viele Kilos haben wir ?",
          "offered": [
            "12,75",
            "12,00",
            "11,75",
            "11,00"
          ],
          "offered_ger": [
            "...",
            "...",
            "...",
            "..."
          ],
          "answer": 0
        }
      ]
    }
  }

}
