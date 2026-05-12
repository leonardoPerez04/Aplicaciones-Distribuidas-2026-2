// src/App.tsx
import Saludo from './Saludo';

function App() {
  return (
    <div>
      {/* Enviamos los datos específicos como si fueran atributos HTML */}
      <Saludo nombre="Leonardo" momento="buenas tardes" />
    </div>
  );
}

export default App;