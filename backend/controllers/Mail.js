import nodemailer from "nodemailer";
import fs from 'fs';


/**
 * Mail Configuration
 * @author kajal
 * */
export class Mail {
   constructor() {
      this.driver = process.env.MAIL_DRIVER ?? 'smtp'
   }

   /**
    * Send Mail
    * @param to
    * @param {message, view, subject, form} mailInfo
    * @param? {path, data} mailInfo["view"]
    * @author kajal
    * */
   async send( to, mailInfo = {}) {
      try {
         let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            secure: process.env.MAIL_ENCRYPTION == "SSL" ? true : false,
            auth: {
               user: process.env.MAIL_USERNAME,
               pass: process.env.MAIL_PASSWORD,
            },
            tls: {rejectUnauthorized: false},
         });

         let messageType = "default";

         if(mailInfo.view) messageType = 'view';
         let html = null;

         if(messageType == 'view') {
            html = fs.readFileSync(mailInfo.view.path, 'utf-8').toString()
            html = this.template(html, mailInfo.view.data)
         }

         let info = await transporter.sendMail({
            from:'"'+mailInfo.subject+'" '+process.env.MAIL_FROM_ADDRESS,
            to: to,
            subject: mailInfo.subject ?? null,
            text: mailInfo.text ? mailInfo.text : "text not define",
            html: messageType == "default" ? mailInfo.message : html
         });

         return info;
      } catch (err) {
         console.trace("Mail Error", err)
      }

   }


   /**
    * Send Mail
    * @param to
    * @param {message, view, subject, form} mailInfo
    * @param? {path, data} mailInfo["view"]
    * @author kajal
    * */
   setDriver(d) {
      this.driver = d;
      return this;
   }


   /**
    * Build Mail Template
    * @param html
    * @param data
    * @author kajal
    * */
   template(html, data) {
      for(let x in data) {
         let petern = new RegExp(`{{\\s*${x}\\s*}}`, 'gm');
         html = html.replaceAll( petern, data[x]);
      }
      return html;
   }
}

