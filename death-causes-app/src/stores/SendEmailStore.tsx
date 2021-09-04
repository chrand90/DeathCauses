import { makeObservable, observable,action, computed } from "mobx";
import emailjs, { init }  from 'emailjs-com';
init("user_Ps3eC7dmaLXkJ03ls1rWm");


export enum SendStatus {
    PREPARTION="Send email preparation",
    SUCCESS="Send email succes",
    ERROR="Send email error",
    SENDING="Sending email"
}

export default class SendEmailStore {
  username: string;
  email: string;
  message: string;
  sendStatus: SendStatus


  constructor() {
    this.username="";
    this.email="";
    this.message=""
    this.sendStatus=SendStatus.PREPARTION
    makeObservable(this, {
      username:observable,
      email: observable,
      message: observable,
      sendStatus: observable,
      inputChange: action.bound,
      inputChangeWrapper: action.bound,
      ready: computed,
      sendForm: action.bound,
    });
  }

  get ready(){
      return this.username.length>2 && this.email.length>3 && this.email.includes("@") && this.message.length>15
  }

  inputChangeWrapper(ev: React.ChangeEvent<HTMLInputElement>) {
    const { name } = ev.currentTarget;
    const rawValue = ev.currentTarget.value;
    const factorname = name;
    const value = rawValue ? rawValue : "";
    this.inputChange(value, factorname);
  }

  inputChange(newValue: string, value: string) {
    if(value==="username"){
        this.username=newValue
    }
    else if(value === "email"){
        this.email=newValue
    }
    else if(value === "message"){
        this.message=newValue
    }
  }

  sendForm(){
    const sendObject = {
        user_email: this.email,
        from_name: this.username,
        message: this.message
    }
    this.sendStatus=SendStatus.SENDING;
    emailjs.send('service_fd5bzll', 'template_vxyul09', sendObject)
    .then((result) => {
        this.sendStatus=SendStatus.SUCCESS
        console.log(result.text);
    }, (error) => {
        this.sendStatus=SendStatus.ERROR
        console.error(error.text);
    });    
  }


}
