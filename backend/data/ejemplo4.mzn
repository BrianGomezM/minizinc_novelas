ACTORES = {Actor1, Actor2, Actor3, Actor4, Actor5, Actor6, Actor7, Actor8} ;

Escenas = [| 1,0,1,0,1,0,0,0,10
           | 0,1,0,1,0,1,0,0,11
           | 1,1,0,0,1,0,1,0,13
           | 0,0,1,1,0,1,1,0,12
           | 1,0,1,0,1,0,1,0,15
           | 0,1,0,1,0,1,1,0,16
           | 1,1,1,0,0,1,0,1,18
           | 0,0,0,1,1,1,1,1,20 |];

Duracion = [3, 2, 3, 1, 2, 4, 2, 3];

Disponibilidad =[|Actor1, 0
                 |Actor2, 0
                 |Actor3, 0
                 |Actor4, 0
                 |Actor5, 0
                 |Actor6, 0
                 |Actor7, 0
                 |Actor8, 0|];

Evitar =[];