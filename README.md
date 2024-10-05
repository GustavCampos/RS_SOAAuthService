# Gamificação 2 - Implementação de Serviços em um Sistema de Informações de Bordo Baseado em SOA - Grupo
LORI RONALDO FLORES MACHADO FILHO • 3 de out. (editado: 3 de out.)
- 20 pontos
- Data de entrega: 10 de out., 22:30

Cada grupo será responsável por desenvolver um serviço essencial do Sistema de Software de Bordo. O sistema permitirá que os carros recebam informações de diferentes fontes (tráfego, clima, localização), autentiquem os usuários, e processem dados em tempo real. 

Os grupos deverão trabalhar de forma colaborativa, conectando seus serviços para criar um sistema modular, escalável e funcional, utilizando conceitos de SOA.


Sobre os serviços: (100XP)

Serviço de Autenticação - Sem nome
Requisitos mínimos
- POST /login: Recebe um JSON com username e password e retorna um token de acesso se as credenciais forem válidas.
- GET /validate: Verifica se um token é válido.


Serviço de Informações sobre Tráfego - O erro está entre o PC e a cadeira
Requisitos mínimos
- GET /traffic: Retorna informações de tráfego, como bloqueios e condições das estradas. Só pode ser acessado por usuários com um token válido.


Serviço de Localização e Posição do Veículo - Async Await
Requisitos mínimos
- GET /location: Retorna as coordenadas GPS do veículo. O acesso só é permitido a usuários com um token válido.


Sobre a integração (100XP)

Para que vocês concluam a atividade com maestria, todos os serviços devem poder se comunicar de forma independente