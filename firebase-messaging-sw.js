// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/3.6.8/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/3.6.8/firebase-messaging.js');

firebase.initializeApp({
    messagingSenderId: 'AIzaSyBx4VEp3gWBCzNU69lpWq1UOPK_5MBnCXE'
});

const messaging = firebase.messaging();
