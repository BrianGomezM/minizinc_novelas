include "globals.mzn";

% Modelo MiniZinc: Planificación de ensayos (Parte 1) adaptable al formato Escenas[a,1..n_escenas+1]

% Actores enumerados (ej. Actor1, Actor2, Actor3)


enum ACTORES; 
int: NumActores = card(ACTORES); 

% Duración de escenas y número de escenas
array[int] of int: Duracion;
int: n_escenas = length(Duracion);

% Matriz Escenas: columnas 1..n_escenas -> participación (0/1), columna n_escenas+1 -> coste por unidad de tiempo
array[ACTORES,1..n_escenas+1] of int: Escenas;

array[int, 1..2] of int: Disponibilidad;  % [actor, max_tiempo]
array[int, 1..2] of int: Evitar;          % [actor1, actor2]

int: m = length(Evitar) div 2;
int: n = length(Disponibilidad) div 2;

% Derivar arrays auxiliares de participación y coste
array[ACTORES,1..n_escenas] of bool: Participa = array2d(ACTORES,1..n_escenas,
    [ Escenas[a,i] = 1 | a in ACTORES, i in 1..n_escenas ]);
array[ACTORES] of int: Coste = [ Escenas[a,n_escenas+1] | a in ACTORES ];

% Variables de decisión
array[1..n_escenas] of var 1..n_escenas: order;
array[1..n_escenas] of var 1..n_escenas: invOrd;
array[ACTORES] of var 1..n_escenas: firstPos;
array[ACTORES] of var 1..n_escenas: lastPos;
var int: costo_total;
array[ACTORES] of var int: costo_actor;
array[1..NumActores, 1..n_escenas] of var 0..1: Escenas_;
array[1..m] of var 0..1: evitar_incumplida;
array[1..NumActores] of var int: tiempo_presencia_actor;


array[1..m] of var int: tiempo_compartido;
var int: tiempo_compartido_total = sum(k in 1..m)(tiempo_compartido[k]);
var int: objetivo = costo_total + tiempo_compartido_total * 1000;

% Permutación e inversión
constraint inverse(order, invOrd);
constraint all_different(order);
%constraint invOrd[1] = 1;  % eliminar simetría

% Cálculo de primera y última posición de cada actor
constraint forall(a in ACTORES)(
    firstPos[a] = min([ invOrd[s] | s in 1..n_escenas where Participa[a,s] ]) /\
    lastPos[a]  = max([ invOrd[s] | s in 1..n_escenas where Participa[a,s] ])
);

% Cálculo del coste por actor
constraint forall(a in ACTORES)(
    costo_actor[a] = sum(p in firstPos[a]..lastPos[a])(
        Duracion[order[p]] * Coste[a]
    )
);

% Definición del coste total
constraint costo_total = sum(a in ACTORES)(costo_actor[a]);


% Tiempo en estudio (presencia real por duración)
constraint forall(a in ACTORES)(
  tiempo_presencia_actor[index_set(ACTORES)[a]] =
    sum(p in firstPos[a]..lastPos[a]) (
      Duracion[order[p]]  % Siempre suma la duración, participen o no
    )
);

% Disponibilidad
constraint forall(i in 1..NumActores)(
    if Disponibilidad[i,2] > 0 then
        tiempo_presencia_actor[i] <= Disponibilidad[i,2]
    else
        true
    endif
);

% Participación real en orden
constraint forall(a in ACTORES, j in 1..n_escenas)(
    Escenas_[index_set(ACTORES)[a], j] = bool2int(Participa[a, order[j]])
);


% Tiempo compartido entre actores a evitar
constraint forall(k in 1..m)(
    tiempo_compartido[k] = sum(j in 1..n_escenas)(
        (j >= firstPos[ACTORES[Evitar[k,1]]] /\ j <= lastPos[ACTORES[Evitar[k,1]]] /\
         j >= firstPos[ACTORES[Evitar[k,2]]] /\ j <= lastPos[ACTORES[Evitar[k,2]]]) 
        * Duracion[order[j]]
    )
);

% Activar incumplimiento si coinciden en alguna escena
constraint forall(k in 1..m)(
    evitar_incumplida[k] = bool2int(
        firstPos[ACTORES[Evitar[k,1]]] <= lastPos[ACTORES[Evitar[k,2]]] /\
        firstPos[ACTORES[Evitar[k,2]]] <= lastPos[ACTORES[Evitar[k,1]]]
    )
);


%RESTRICCION DE SIMETRIA%
%Priorizar escenas del actor más caro
array[ACTORES] of int: costes = [Coste[a] | a in ACTORES];
int: max_coste = max(costes);
ACTORES: actor_caro = [a | a in ACTORES where Coste[a] == max_coste][1];

var int: promedio_posiciones = 
    sum(s in 1..n_escenas where Participa[actor_caro, s])(invOrd[s]) div
    sum(s in 1..n_escenas where Participa[actor_caro, s])(1);

constraint promedio_posiciones <= n_escenas div 2;

solve :: int_search(order, dom_w_deg, indomain_min, complete) minimize objetivo;

output [
    "Orden de escenas: ", show(order), "\n",
    "Coste total: ", show(costo_total), "\n",
    "Tiempo compartido (Evitar): ", show(tiempo_compartido_total), "\n",
    "Detalles por actor:\n"
] ++ [
    "  " ++ show(a) ++ ": Escenas [" ++ show(firstPos[a]) ++ ".." ++ show(lastPos[a]) ++ "] " ++
    "Coste = " ++ show(costo_actor[a]) ++ ", Tiempo en estudio = " ++ show(tiempo_presencia_actor[index_set(ACTORES)[a]]) ++ "\n"
    | a in ACTORES
];