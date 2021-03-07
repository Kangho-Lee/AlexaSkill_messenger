# AlexaSkill_messenger
음성비서 AI 인 Amazon Alexa와 aws lambda, dynamodb 등을 활용한 메신저프로그램 제작

<img src="https://github.com/Kangho-Lee/AlexaSkill_messenger/blob/master/alexa.png" with="600" />

* Overview
  - 알렉사에게 메신저를 통해 전달할 메세지 내용을 영어로 말한다
  - 전달 받은 음성을 구글 번역 api 와 연동하여 번역한다
  - 번역된 텍스트 데이터가 지정한 메신저(여기서는 Slack 메신저를 사용했습니다.) 채널로 출력한다
  - 메세지를 받는 사용자는 영어를 하지 못해도 메신저를 통해 대화할 수 있다

* Feature
  - 번역할 언어 선택(한글, 중국어, 독일어)
  - 전송할 Slack의 채널 선택
  - 전송된 메세지를 데이터베이스에 축적(AWS DynamoDB사용)

* Architecture
<img src="https://github.com/Kangho-Lee/AlexaSkill_messenger/blob/master/alexa%20overview.JPG" with="600" />
