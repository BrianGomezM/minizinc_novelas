include "globals.mzn";

% Modelo MiniZinc: Planificación de ensayos (Parte 1) adaptable al formato Escenas[a,1..n_escenas+1]

% Actores enumerados (ej. Actor1, Actor2, Actor3)
enum ACTORES;
int: NumActores = card(ACTORES);

% Duración de escenas y número de escenas
array[int] of int: Duracion;  % Duraciones en orden de escena
int: n_escenas = length(Duracion);

% Matriz Escenas: columnas 1..n_escenas -> participación (0/1), columna n_escenas+1 -> coste por unidad de tiempo
array[ACTORES,1..n_escenas+1] of int: Escenas;

% Derivar arrays auxiliares de participación y coste
array[ACTORES,1..n_escenas] of bool: Participa = array2d(ACTORES,1..n_escenas,
    [ Escenas[a,i] = 1 | a in ACTORES, i in 1..n_escenas ]);
array[ACTORES] of int: Coste = [ Escenas[a,n_escenas+1] | a in ACTORES ];

% Variables de decisión
array[1..n_escenas] of var 1..n_escenas: order;        % order[p] = escena en la posición p
array[1..n_escenas] of var 1..n_escenas: invOrd;       % invOrd[e] = posición de la escena e
array[ACTORES] of var 1..n_escenas: firstPos;           % primera posición en que cada actor aparece
array[ACTORES] of var 1..n_escenas: lastPos;            % última posición en que cada actor aparece
array[ACTORES] of var int: costo_actor;                  % coste individual por actor
array[ACTORES] of var int: tiempo_presencia_actor;
var int: costo_total;                                    % coste total a minimizar

% Permutación e inversión
constraint inverse(order, invOrd);
constraint all_different(order);

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

constraint forall(a in ACTORES)(
    tiempo_presencia_actor[a] = sum(p in firstPos[a]..lastPos[a])(
        Duracion[order[p]]
    )
);

% Definición del coste total
constraint costo_total = sum(a in ACTORES)( costo_actor[a] );

% Resolución: minimizar coste_total
solve :: int_search(order, dom_w_deg, indomain_min) minimize costo_total;
%solve minimize costo_total;
% Salida de resultados


output [
    "Orden de escenas: ", show(order), "\n",
    "Coste total: ", show(costo_total), "\n",
    "Detalles por actor:\n"
] ++ [
    "  " ++ show(a) ++ ": Escenas [" ++ show(firstPos[a]) ++ ".." ++ show(lastPos[a]) ++ "] " ++
    "Coste = " ++ show(costo_actor[a]) ++ ", Tiempo en estudio = " ++ show(tiempo_presencia_actor[a]) ++ "\n"
    | a in ACTORES
];