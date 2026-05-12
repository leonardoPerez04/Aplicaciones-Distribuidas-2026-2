// src/Saludo.tsx

// 1. Definimos la estructura de las props con TypeScript
interface SaludoProps {
    nombre: string;
    momento: string;
}

// 2. Extraemos las props directamente en los parámetros de la función
export default function Saludo({ nombre, momento }: SaludoProps) {
    return (
        <div>
            {/* 3. Usamos las llaves {} para inyectar las variables en el HTML */}
            <h1>Hola {nombre} {momento}</h1>
        </div>
    );
}