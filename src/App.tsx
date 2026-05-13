// src/App.tsx
import Saludo from './Saludo';
import { useState } from 'react';
function App() {
  const [counter, setCounter] = useState(0);
  return (
    <div>
      <p>Contador: {counter}</p>
      <button onClick={() => setCounter(counter + 1)}>
        Incrementar
      </button>
      {/* Enviamos los datos específicos como si fueran atributos HTML */}
      <Saludo nombre="Leonardo" momento="buenas tardes" />
    </div>
  );
}

export default App;