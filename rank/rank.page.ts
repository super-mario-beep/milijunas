import { Component, OnInit } from '@angular/core';
import { userData } from '../userData';
//import { Http } from '@angular/http';
import { HttpHeaders } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { HTTP } from '@ionic-native/http/ngx';
import { AdMobFree, AdMobFreeBannerConfig,AdMobFreeInterstitial,AdMobFreeInterstitialConfig } from '@ionic-native/admob-free/ngx';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-rank',
  templateUrl: './rank.page.html',
  styleUrls: ['./rank.page.scss'],
})
export class RankPage implements OnInit {

  bestUserOne =""
  bestUserTwo =""
  bestUserThree =""
  bestUserFour =""
  bestUserFive =""
  error = "";
  constructor(    
    private userData: userData,
    public http: HTTP,
    public toastController: ToastController,
    private router: Router,
    private admobFree: AdMobFree,
    public storage: Storage

    ) { 
      this.storage.get("lang").then((result)=>{
        if(result == "ger"){
          document.getElementById("body__").style.backgroundImage = "url('../../assets/New_folder/ger/extra_hd_logo.jpg')"
          document.getElementById("naj").innerText = "Die größten gewonnenen Beträge anderer Spieler"
          document.getElementById("record-key").innerText = "Der größte gewonnene Betrag"
          document.getElementById("record-mil-key").innerText = "Gewonnener Betrag von 1 Million"
          document.getElementById("ukpuan_").innerText = "Gewonnener Gesamtbetrag"
          document.getElementById("butn").innerText = "Zurück ins Menu"
        }
      })
    setTimeout(() => {
      this.setRecords()
      this.setRecordToBase()
    }, 50);
    for(var i = 0; i < 5; i++){
      if(i === 0){
        this.bestUserOne = "269.782.000 €"
      }if(i === 1){
        this.bestUserTwo = "249.114.000 €"
      }if(i === 2){
        this.bestUserThree = "233.850.000 €"
      }if(i === 3){
        this.bestUserFour = "232.862.900 €"
      }if(i === 4){
        this.bestUserFive = "219.024.600 €"
      }
    }

    try{
      setTimeout(() => {
        var menu = document.getElementById("mainBox")
        menu.style.opacity = "1"
      }, 250);
      

      /*
      setTimeout(() => {
        const adConfigFull: AdMobFreeInterstitialConfig = {
          id:"ca-app-pub-9933506788213398/5405545479",
          autoShow: true
        }
        this.admobFree.interstitial.config(adConfigFull);
        this.admobFree.interstitial.prepare().then(() => {
        }).catch((e) =>{
          console.log(e)
        })
      }, 2000);*/


    }catch{
      //
    }

  }
  backToMenu(){
    this.router.navigate(['home'])
  }

  ngOnInit() {
  }

  setRecordToBase(){
    document.getElementById("leaderboard").style.display = "block"

    return
    if(this.userData.userID === "")
      return
    this.http.sendRequest('https://www.spotted.com.hr/tzbm/index.php',
      {
        method: 'post',
        data: {id: this.userData.userID, record: this.userData.getRecordSum()},
        headers: { Authorization: 'OAuth2: token' },
        timeout: 3000
      }
    )
      .then(response => {
        if(response.data === "Ok"){
          this.getBestRecords()
        }else{
          this.toastNoNet()
          document.getElementById("leaderboard").style.display = "none"
        }

      })
      .catch(response => {
        this.toastNoNet()
        document.getElementById("leaderboard").style.display = "none"
      });
  }

  getBestRecords(){
    this.http.sendRequest('https://www.spotted.com.hr/tzbm/getBest.php',
      {
        method: 'post',
        data: {},
        headers: { Authorization: 'OAuth2: token' },
        timeout: 3000
      }
    )
      .then(response => {
        if(response.data.includes("[") ){
          var json = JSON.parse(response.data)
          for(var i = 0; i < json.length; i++){
            if(i === 0){
              this.bestUserOne = "247.782.000"
            }if(i === 1){
              this.bestUserTwo = "217.114.000"
            }if(i === 2){
              this.bestUserThree = "211.850.000"
            }if(i === 3){
              this.bestUserFour = "201.862.900"
            }if(i === 4){
              this.bestUserFive = "198.024.600"
            }
          }
          if(this.numberWithCommas(this.userData.getRecordSum().toString()) === this.bestUserOne){
            document.getElementById("best1").classList.add("my-records-record-value-me")

          }if(this.numberWithCommas(this.userData.getRecordSum().toString()) === this.bestUserTwo){
            document.getElementById("best2").classList.add("my-records-record-value-me")

          }if(this.numberWithCommas(this.userData.getRecordSum().toString()) === this.bestUserThree){
            document.getElementById("best3").classList.add("my-records-record-value-me")

          }if(this.numberWithCommas(this.userData.getRecordSum().toString()) === this.bestUserFour){
            document.getElementById("best4").classList.add("my-records-record-value-me")

          }if(this.numberWithCommas(this.userData.getRecordSum().toString()) === this.bestUserFive){
            document.getElementById("best5").classList.add("my-records-record-value-me")
          }
          document.getElementById("leaderboard").style.display = "block"
  
        }else{
          document.getElementById("leaderboard").style.display = "none"
          this.toastNoNet()
        }
      })
      .catch(response => {
        document.getElementById("leaderboard").style.display = "none"
        this.toastNoNet()
      });
  }

  setRecords(){
    document.getElementById("record-sum-value").innerText = this.numberWithCommas(this.userData.getRecordSum()) + " "
    if(this.userData.getRecordMil() === 0){
      document.getElementById("record-key").style.display = "block"
      document.getElementById("record-value").style.display = "block"
      document.getElementById("record-div").style.display = "block"
      document.getElementById("record-mil-div").style.display = "none"
      document.getElementById("record-mil-key").style.display = "none"
      document.getElementById("record-mil-value").style.display = "none"
      document.getElementById("record-value").innerText = this.numberWithCommas(this.userData.getRecord()) + " "
    }else{
      document.getElementById("record-mil-key").style.display = "block"
      document.getElementById("record-mil-value").style.display = "block"
      document.getElementById("record-div").style.display = "none"
      document.getElementById("record-mil-div").style.display = "block"
      document.getElementById("record-key").style.display = "none"
      document.getElementById("record-value").style.display = "none"
      document.getElementById("record-mil-value").innerText = this.userData.getRecordMil().toString()

    }
  }

  async toastNoNet() {
    const toast = await this.toastController.create({
      message: 'Provjerite internet vezu za globalne rezultate',
      duration: 3000
    });
    toast.present();
  }
  numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }


}
