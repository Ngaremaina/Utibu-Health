from server import app
from flask import request
import requests
from requests.auth import HTTPBasicAuth


@app.route('/payments', methods=['POST'])
def init_stk():
    total = request.get_json()["total"]
    phone_number = request.get_json()["phone_number"]

    endpoint = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
    access_token = get_access_token()
    headers = { "Authorization": "Bearer %s" % access_token }

    data = {
    
    "BusinessShortCode": 174379,
    "Password": "MTc0Mzc5YmZiMjc5ZjlhYTliZGJjZjE1OGU5N2RkNzFhNDY3Y2QyZTBjODkzMDU5YjEwZjc4ZTZiNzJhZGExZWQyYzkxOTIwMjQwMzMxMTQ0ODM2",
    "Timestamp": "20240331144836",
    "TransactionType": "CustomerPayBillOnline",
    "Amount": total,
    "PartyA": phone_number,
    "PartyB": 174379,
    "PhoneNumber": phone_number,
    "CallBackURL": "https://mydomain.com/path",
    "AccountReference": "Utibu",
    "TransactionDesc": "Payment of Medications" 
  }
  

    res = requests.post(endpoint, json = data, headers = headers)
    return res.json()

def get_access_token():
    consumer_key = "YLNKUXOGeaM1tajNdbk7yqojXWqGybQCTaAunprmBqGWaosF"
    consumer_secret = "KfekE9D453nmAyWYAQadGKoAN0mLBjFX9XuiRUdpI5GOD8Ytj3IXqhG9R2pToFRd"
    endpoint = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'

    r = requests.get(endpoint, auth=HTTPBasicAuth(consumer_key, consumer_secret))
    data = r.json()
    return data['access_token']