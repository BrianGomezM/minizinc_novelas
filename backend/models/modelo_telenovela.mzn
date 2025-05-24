include "globals.mzn";

%%% Modelo Optimizado de Planificación de Ensayos (Versión Mejorada) %%%

% Parámetros de entrada
enum ACTORES;
int: num_escenas;
int: num_pares;

array[ACTORES, 1..num_escenas+1] of int: Escenas;
array[ACTORES] of int: costo_actor = [Escenas[a, num_escenas+1] | a in ACTORES];
array[1..num_escenas] of int: duracion;
array[ACTORES] of int: disponibilidad;
array[1..num_pares, 1..2] of ACTORES: evitar_pares;

% Variables de decisión
array[1..num_escenas] of var 1..num_escenas: orden;
array[1..num_escenas] of var 1..num_escenas: posicion;
array[ACTORES] of var 0..num_escenas: primera_escena;
array[ACTORES] of var 0..num_escenas: ultima_escena;
array[ACTORES] of var int: tiempo_actor;
var int: costo_total;
var int: tiempo_compartido;

% Eliminar simetrías mínimas (solo orden[1] = 1)
constraint orden[1] = 1;
constraint alldifferent(orden);
constraint inverse(orden, posicion);

% Calcular primera y última aparición en el cronograma
constraint forall(a in ACTORES)(
    if sum([Escenas[a,e] | e in 1..num_escenas]) > 0 then
        primera_escena[a] = min([posicion[e] | e in 1..num_escenas where Escenas[a,e] = 1]) /\
        ultima_escena[a]  = max([posicion[e] | e in 1..num_escenas where Escenas[a,e] = 1])
    else
        primera_escena[a] = 0 /\
        ultima_escena[a]  = 0
    endif
);

% Calcular tiempo que cada actor debe permanecer
constraint forall(a in ACTORES)(
    tiempo_actor[a] = 
        if primera_escena[a] > 0 then
            sum(p in primera_escena[a]..ultima_escena[a])(duracion[orden[p]])
        else 0 endif
);

% Respetar disponibilidad
constraint forall(a in ACTORES where disponibilidad[a] > 0)(
    tiempo_actor[a] <= disponibilidad[a]
);

% Tiempo compartido entre pares a evitar
% Tiempo compartido entre pares a evitar
constraint tiempo_compartido = 
    sum(i in 1..num_pares)(
        let {
            ACTORES: a1 = evitar_pares[i,1],
            ACTORES: a2 = evitar_pares[i,2],
            var 0..num_escenas: inicio = max(primera_escena[a1], primera_escena[a2]),
            var 0..num_escenas: fin    = min(ultima_escena[a1], ultima_escena[a2])
        } in
        if inicio <= fin then
            sum(p in inicio..fin)(duracion[orden[p]])
        else
            0
        endif
    );



% Costo total de todos los actores
constraint costo_total = sum(a in ACTORES)(tiempo_actor[a] * costo_actor[a]);

%Estrategia de busqueda
solve :: int_search(orden, first_fail, indomain_min)
minimize costo_total + tiempo_compartido;

% Salida clara
output [
    "Orden de escenas: ", show([orden[e] | e in 1..num_escenas]), "\n",
    "Costo total: ", show(costo_total), "\n",
    "Tiempo compartido actores a evitar: ", show(tiempo_compartido), "\n",
    "Tiempos por actor:\n"
] ++ [
    "Actor " ++ show(a) ++ ": " ++ 
    if fix(primera_escena[a]) > 0 then 
        show(fix(primera_escena[a])) ++ "->" ++ show(fix(ultima_escena[a])) ++ 
        " (" ++ show(fix(tiempo_actor[a])) ++ "u, Costo: " ++ show(fix(tiempo_actor[a] * costo_actor[a])) ++ 
        if disponibilidad[a] > 0 then " MAX:" ++ show(disponibilidad[a]) else "" endif ++ ")\n"
    else 
        "No participa\n" 
    endif
    | a in ACTORES
];
