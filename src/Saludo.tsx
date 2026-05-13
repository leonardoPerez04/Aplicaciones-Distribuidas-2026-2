interface SaludoProps {
    nombre: string;
    momento: string;
}

export default function Saludo({ nombre, momento }: SaludoProps) {
    return (
        <div>
            {/* 3. Usamos las llaves {} para inyectar las variables en el HTML */}
            <h1>Hola {nombre} {momento}</h1>
        </div>
    );
}