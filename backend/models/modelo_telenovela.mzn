include "globals.mzn";

% -------------------------
% Parámetros de entrada
% -------------------------
enum ACTORES;                        % Conjunto de actores
int: num_escenas;                   % Número total de escenas
int: num_pares;                     % Número de pares de actores a evitar compartir tiempo

array[ACTORES, 1..num_escenas+1] of int: Escenas;  
% Matriz que indica la participación del actor en escenas (1 = participa, 0 = no participa)
% La columna num_escenas+1 guarda el costo por unidad de tiempo para cada actor

array[ACTORES] of int: costo_actor = [Escenas[a, num_escenas+1] | a in ACTORES];
% Extrae el costo individual de cada actor de la última columna de Escenas

array[1..num_escenas] of int: duracion;  
% Duración de cada escena

array[ACTORES] of int: disponibilidad;  
% Disponibilidad máxima de cada actor (tiempo máximo que puede actuar)

array[1..num_pares, 1..2] of ACTORES: evitar_pares;  
% Pares de actores que deben evitar compartir tiempo (evitar_pares[i,1] y evitar_pares[i,2])

% -------------------------
% Cálculo de límites superiores para variables
% -------------------------
int: max_duracion = sum(duracion);  
% Suma total de duración de todas las escenas: límite máximo de tiempo

int: max_costo = sum(a in ACTORES)(max_duracion * costo_actor[a]);  
% Costo máximo posible (suposición extrema: actor trabaja todo el tiempo)

% -------------------------
% Variables de decisión
% -------------------------
array[1..num_escenas] of var 1..num_escenas: orden;  
% Orden en que se deben realizar las escenas (permutación de 1..num_escenas)

array[1..num_escenas] of var 1..num_escenas: posicion;  
% Posición inversa de orden: posicion[escena] = lugar en la secuencia

array[ACTORES] of var 1..num_escenas: primera_escena;  
array[ACTORES] of var 1..num_escenas: ultima_escena;  
% Primera y última aparición (posición) del actor en la secuencia de escenas

array[ACTORES] of var 0..max_duracion: tiempo_actor;  
% Tiempo total que cada actor está activo (sumando duración de escenas entre primera y última)

array[1..num_pares] of var 0..max_duracion: tiempo_compartido_par;  
% Tiempo compartido (solapamiento) entre cada par de actores a evitar

var 0..max_duracion: tiempo_compartido;  
% Tiempo total compartido sumando todos los pares

var 0..max_costo: costo_total;  
% Costo total de todos los actores

% -------------------------
% Restricciones para evitar simetrías triviales
% -------------------------
constraint orden[1] = 1;  
% Fija la primera escena en la posición 1 para reducir simetrías

constraint alldifferent(orden);  
% Todas las escenas deben ocupar posiciones diferentes (permutación válida)

constraint inverse(orden, posicion);  
% Relaciona 'orden' y 'posicion' como permutaciones inversas

% -------------------------
% Cálculo de primera y última aparición para cada actor
% -------------------------
constraint forall(a in ACTORES) (
    let {
        set of int: escenas_actor = { e | e in 1..num_escenas where Escenas[a,e] = 1 }
    } in
    if card(escenas_actor) > 0 then
        % Todas las escenas en las que actúa deben estar entre primera_escena y ultima_escena
        forall(e in escenas_actor)(
            posicion[e] >= primera_escena[a] /\
            posicion[e] <= ultima_escena[a]
        ) /\
        % Primera escena no puede venir después que la última
        primera_escena[a] <= ultima_escena[a]
    else
        % Si no actúa en ninguna escena, se define fuera de rango
        primera_escena[a] = num_escenas + 1 /\
        ultima_escena[a] = 0
    endif
);

% -------------------------
% Cálculo del tiempo total que cada actor permanece
% -------------------------
constraint forall(a in ACTORES)(
    tiempo_actor[a] =
        if primera_escena[a] <= ultima_escena[a] then
            % Suma de duraciones entre primera y última escena del actor
            sum(p in primera_escena[a]..ultima_escena[a])(
                duracion[orden[p]]
            )
        else
            0
        endif
);

% -------------------------
% Respetar la disponibilidad máxima de cada actor
% -------------------------
constraint forall(a in ACTORES where disponibilidad[a] > 0)(
    tiempo_actor[a] <= disponibilidad[a]
);

% -------------------------
% Cálculo del tiempo compartido (solapamiento) entre pares de actores a evitar
% -------------------------
constraint forall(i in 1..num_pares)(
    let {
        ACTORES: a1 = evitar_pares[i,1],
        ACTORES: a2 = evitar_pares[i,2],
        var int: inicio_interseccion = max(primera_escena[a1], primera_escena[a2]),
        var int: fin_interseccion = min(ultima_escena[a1], ultima_escena[a2])
    } in
    (
        (inicio_interseccion <= fin_interseccion) -> 
            tiempo_compartido_par[i] = sum(p in inicio_interseccion..fin_interseccion)(duracion[orden[p]])
    ) /\
    (
        (inicio_interseccion > fin_interseccion) -> 
            tiempo_compartido_par[i] = 0
    )
);


% Tiempo total compartido sumando todos los pares
constraint tiempo_compartido = sum(i in 1..num_pares)(tiempo_compartido_par[i]);

% -------------------------
% Cálculo del costo total
% -------------------------
constraint costo_total = sum(a in ACTORES)(tiempo_actor[a] * costo_actor[a]);

% -------------------------
% Estrategia de búsqueda para mejorar el rendimiento
% -------------------------
solve :: seq_search([
    int_search(orden, input_order, indomain_min),
    int_search(primera_escena, smallest, indomain_min),
    int_search(ultima_escena, largest, indomain_max)
]) minimize costo_total + tiempo_compartido;

% -------------------------
% Salida del modelo
% -------------------------
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
        (if disponibilidad[a] > 0 then " MAX:" ++ show(disponibilidad[a]) else "" endif) ++ ")\n"
    else 
        "No participa\n" 
    endif
    | a in ACTORES
];
