include "globals.mzn";

%%% Modelo de Planificación de Ensayos para Telenovela %%%

% Parámetros de entrada
enum ACTORES;
int: num_escenas;
array[ACTORES, 1..num_escenas] of int: participacion;
array[ACTORES] of int: costo_actor;
array[1..num_escenas] of int: duracion;

% Variables de decisión
array[1..num_escenas] of var 1..num_escenas: orden;
array[ACTORES] of var 1..num_escenas: primera_part;
array[ACTORES] of var 1..num_escenas: ultima_part;
array[ACTORES] of var int: tiempo_actor;
var int: costo_total;

% Todas las escenas deben tener una posición única
constraint alldifferent(orden);

% Restricciones de presencia por actor (versión optimizada)
constraint forall(a in ACTORES)(
    let {
        set of int: escenas = {i | i in 1..num_escenas where participacion[a,i] == 1}
    } in
    if card(escenas) > 0 then
        primera_part[a] = min([min([j | j in 1..num_escenas where orden[j] = e]) | e in escenas]) /\
        ultima_part[a] = max([max([j | j in 1..num_escenas where orden[j] = e]) | e in escenas])
    else
        primera_part[a] = 1 /\ ultima_part[a] = 1 % Para actores que no participan
    endif
);

% Calcular tiempo de presencia por actor
constraint forall(a in ACTORES)(
    tiempo_actor[a] = sum([duracion[orden[i]] | i in primera_part[a]..ultima_part[a]])
);

% Cálculo del costo total
constraint costo_total = sum(a in ACTORES)(tiempo_actor[a] * costo_actor[a]);

% Objetivo: minimizar el costo total
solve minimize costo_total;

% Salida
output [
    "Orden de escenas: ", show(orden), "\n",
    "Costo total: ", show(costo_total), "\n",
    "Tiempos por actor:\n"
] ++ [
    "Actor " ++ show(a) ++ ": " ++ show(tiempo_actor[a]) ++ " unidades (Costo: " ++ show(tiempo_actor[a]*costo_actor[a]) ++ ")\n"
    | a in ACTORES
];