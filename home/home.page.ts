import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { userData } from '../userData';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { AdMobFree, AdMobFreeBannerConfig,AdMobFreeInterstitial,AdMobFreeInterstitialConfig, AdMobFreeRewardVideoConfig } from '@ionic-native/admob-free/ngx';
import { AlertController } from '@ionic/angular';
import { soundEditor } from '../soundEditor';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  activityStarted = false;
  questionsURL = "assets/data/quiz.json"
  adReady = false;

  constructor(
    private router: Router,
    private userData: userData,
    private platform: Platform,
    public storage: Storage,
    private admobFree: AdMobFree,
    public alertController: AlertController,

  ) {
    this.storage.set("soundOn",null)
    
    setTimeout(() => {
      const adConfig: AdMobFreeBannerConfig = {
        id:"ca-app-pub-9933506788213398/5283233886",//0.5e 
        autoShow: true
      }
      this.admobFree.banner.config(adConfig);
      this.admobFree.banner.prepare().then(() => {
        
      })
    }, 300);
    document.addEventListener('admob.banner.events.LOAD', (reslut) =>{
      this.adReady = true;
    })
    this.loadAnyAd()
    
    
    userData.setupStorage(storage)/*
    this.userData.storage.get("lang").then((result)=>{
      if(result == "ger"){
        this.gerLang()
      }else{
        this.croLang()
      }
    })*/
  }
  a = ""
  b = ""
  c = ""
  d = ""
  p = ""
  q = ""
  CreateQuestion(){
    let json = '{"question":"' + this.p + '",';
    json += '"offered":[' + '"' + this.a + '",';
    json += '"' + this.b + '",';
    json += '"' + this.c + '",';
    json += '"' + this.d + '"],';
    json += '"answer":' + this.q +"}";
    console.log(json)
  }

  closeApk(){
    navigator['app'].exitApp()
  }

  loadAnyAd(){
    setTimeout(() => {
      const adConfig: AdMobFreeBannerConfig = {
        id:"ca-app-pub-9933506788213398/7101770527",//any
        autoShow: true
      }
      if(this.adReady){
        return
      }else{
        this.admobFree.banner.config(adConfig);
        this.admobFree.banner.prepare().then(() => {
        })      
        document.addEventListener('admob.banner.events.LOAD', (reslut) =>{
          this.adReady = true; 
        })
        this.loadAnyAd();
      }
    }, 2000);
  }



  startQuiz(){
    if(this.activityStarted)
      return
    this.activityStarted = true;
    var menu = document.getElementById("mainBox")
    menu.style.opacity = "0"
    setTimeout(() => {
      this.activityStarted = false;
      this.router.navigate(['quiz'])
    }, 1500);
  }

  startRank(){
    if(this.activityStarted)
      return
    this.activityStarted = true;
    var menu = document.getElementById("mainBox")
    menu.style.opacity = "0"
    setTimeout(() => {
      this.activityStarted = false;
      this.router.navigate(['rank'])
    }, 1500);
  }

  startCustom(){
    if(this.activityStarted)
      return
      window.open("https://play.google.com/store/apps/details?id=com.neoblastapps.tzbm")
  }
  soundOn(){
    var on_ = document.getElementById("sound_img")
    on_.style.display = "block"
    var off_ = document.getElementById("mute_img")
    off_.style.display = "none"
    this.storage.set("soundOn",null);
  }

  soundOff(){
    var on_ = document.getElementById("sound_img")
    on_.style.display = "none"
    var off_ = document.getElementById("mute_img")
    off_.style.display = "block"
    this.storage.set("soundOn","off")
  }
  croLang(){
    var cro = document.getElementById("cro_img")
    cro.style.border = "3px solid white"
    var ger = document.getElementById("ger_img")
    ger.style.border = "3px solid rgba(0,0,0,0.3)"
    this.storage.set("lang","cro");
    document.getElementById("body").style.backgroundImage = "url('../../assets/New_folder/extra_hd_logo.jpg')"
    document.getElementById("__1").innerText = "POKRENI"
    document.getElementById("__2").innerText = "OCIJENITE NAS"
    document.getElementById("__3").innerText = "LJESTVICA"
    document.getElementById("__4").innerText = "IZLAZ"
  }
  gerLang(){
    var cro = document.getElementById("cro_img")
    cro.style.border = "3px solid rgba(0,0,0,0.3)"
    var ger = document.getElementById("ger_img")
    ger.style.border = "3px solid white"
    this.storage.set("lang","ger");
    document.getElementById("body").style.backgroundImage = "url('../../assets/New_folder/ger/extra_hd_logo.jpg')"
    document.getElementById("__1").innerText = "Ausführen"
    document.getElementById("__2").innerText = "Bewerten Sie uns"
    document.getElementById("__3").innerText = "Skala"
    document.getElementById("__4").innerText = "Ausgang"
    this.storage.set("lang","ger");
    
  }
}
