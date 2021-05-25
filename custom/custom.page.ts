import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { HTTP } from '@ionic-native/http/ngx';

@Component({
  selector: 'app-custom',
  templateUrl: './custom.page.html',
  styleUrls: ['./custom.page.scss'],
})
export class CustomPage implements OnInit {

  questionCounter = 80
  question = ""
  answerA = ""
  answerB = ""
  answerC = ""
  answerD = ""
  price = ""
  correct = ""
  constructor(public alertController: AlertController,
    public http: HTTP,
    ) { 
      try{
        var menu = document.getElementById("mainBox")
        menu.style.opacity = "1"
      }catch{
        //
      }
    }

  ngOnInit() {
  }
  checkQuestionLen(){
    this.questionCounter = 80 - (this.question.length)
  }
  showFullQuestion(){
    document.getElementById("mainBoxC").style.height = "540px";
    document.getElementById("pick1").style.display = "block";
    document.getElementById("pick2").style.display = "block";
    document.getElementById("mojbutton").style.display = "block";
  }
  async submit(){
    if(this.question.length < 5 || this.answerA.length < 1 || this.answerB.length < 1 ||this.answerC.length < 1 || this.answerD.length < 1 || this.price.length < 1 || this.correct.length < 1){
      const alert = await this.alertController.create({
        cssClass: 'my-css',
        header: 'Ups',
        message: 'Izgleda da nisu sva polja ispunjena, molimo unesite pitanje i odgovore te izaberite točan odgovor i njegov iznos.',
        buttons: [{
            text: 'Ok',
            handler: () => {
              console.log('Confirm Okay');
            }
          }
        ]
      });
  
      await alert.present();
    }else{
      this.http.sendRequest('https://www.spotted.com.hr/tzbm/setQuestion.php',
        {
          method: 'post',
          data: {question: this.question, aa: this.answerA, ab: this.answerB, ac: this.answerC, ad: this.answerD, price:this.price, correct: this.correct},
          headers: { Authorization: 'OAuth2: token' },
          timeout: 3000
        }
      ) 

      
      const alert = await this.alertController.create({
        cssClass: 'my-css',
        header: 'Hvala Vam',
        message: 'Vaše pitanje će biti pregledano unutar 24 sata i dodano u kviz',
        buttons: [{
            text: 'Ok',
            handler: () => {
              console.log('Confirm Okay');
            }
          }
        ]
      });
      this.question = ""
      this.answerA = ""
      this.answerB = ""
      this.answerC = ""
      this.answerD = ""
      this.price = ""
      this.correct = ""
  
      await alert.present();
    }
  }

}
