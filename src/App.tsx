import {useEffect, useState} from 'react';
import {DragDropContext, Draggable, Droppable, DropResult} from 'react-beautiful-dnd';
import './App.css';

type Lane = {
  id: string;
  title: string;
  cards: Card[];
};

type Card = {
  id: string;
  title: string;
  info: string;
};

const isValidData = (data: any): data is Lane[] => {
  if (!Array.isArray(data)) return false;
  return data.every((lane) => {
    if (typeof lane !== 'object') return false;
    if (typeof lane.id !== 'string') return false;
    if (typeof lane.title !== 'string') return false;
    if (!Array.isArray(lane.cards)) return false;
    return lane.cards.every((card: any) => {
      if (typeof card !== 'object') return false;
      if (typeof card.id !== 'string') return false;
      if (typeof card.title !== 'string') return false;
      if (typeof card.info !== 'string') return false;
      return true;
    });
  });
};


function App() {
  const [lanes, setLanes] = useState<Lane[]>([]);
  const handleDrag = (result: DropResult) => {
    const {source, destination} = result;
    // If the card is dropped outside of a droppable area
    if (!destination) return;
    // If the card is dropped back into the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    //dropped in the same lane
    if (destination.droppableId === source.droppableId) {
      const lane = lanes.find((lane) => lane.id === source.droppableId);
      if (lane) {
        const newCards = [...lane.cards];
        const [removedCard] = newCards.splice(source.index, 1);
        newCards.splice(destination.index, 0, removedCard);
        const newLane = {
          ...lane,
          cards: newCards,
        };
        const newLanes = lanes.map((lane) => {
          if (lane.id === newLane.id) return newLane;
          return lane;
        });
        setLanes(newLanes);
        return;
      }
    }

    // dropped in a different lane
    if (destination.droppableId !== source.droppableId) {
      const sourceLane = lanes.find((lane) => lane.id === source.droppableId);
      const destinationLane = lanes.find((lane) => lane.id === destination.droppableId);
      if (!sourceLane || !destinationLane) return;

      const sourceCards = [...sourceLane.cards];
      const destinationCards = [...destinationLane.cards];

      const [removedCard] = sourceCards.splice(source.index, 1);
      destinationCards.splice(destination.index, 0, removedCard);

      const newSourceLane = {
        ...sourceLane,
        cards: sourceCards,
      };
      const newDestinationLane = {
        ...destinationLane,
        cards: destinationCards,
      };

      const newLanes = lanes.map((lane) => {
        if (lane.id === newSourceLane.id) return newSourceLane;
        if (lane.id === newDestinationLane.id) return newDestinationLane;
        return lane;
      });

      setLanes(newLanes);
      return;
    }
  };

  const addCard = () => {
    // new card will be added to the first lane
    // check if there is a lane
    const lane = lanes[0];
    if (!lane) return;
    const newCard = {
      id: `card-${Date.now()}`,
      title: 'New Card',
      info: '',
    };
    const newLane = {
      ...lane,
      cards: [...lane.cards, newCard],
    };
    const newLanes = lanes.map((lane) => {
      if (lane.id === newLane.id) return newLane;
      return lane;
    });
    setLanes(newLanes);
  };

  const addLane = () => {
    const newLane = {
      id: `lane-${Date.now()}`,
      title: 'New Lane',
      cards: [],
    };
    setLanes([...lanes, newLane]);
  };

  const exportJSON = () => {
    const data = JSON.stringify(lanes);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'data.json';
    link.href = url;
    link.click();
  }

  const importJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      if (!target.files) return;
      const file = target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (!result) return;
        const data = JSON.parse(result as string);
        // check if the data is valid
        if (!isValidData(data)) return;
        setLanes(data);
      };
      reader.readAsText(file);

    };
    input.click();
  }

  const deleteLane = (id: string) => {
    const newLanes = lanes.filter((lane) => lane.id !== id);
    setLanes(newLanes);
  };

  const deleteCard = (laneId: string, cardId: string) => {
    const lane = lanes.find((lane) => lane.id === laneId);
    if (!lane) return;
    const newCards = lane.cards.filter((card) => card.id !== cardId);
    const newLane = {
      ...lane,
      cards: newCards,
    };
    const newLanes = lanes.map((lane) => {
      if (lane.id === newLane.id) return newLane;
      return lane;
    });
    setLanes(newLanes);
  };

  const editLaneTitle = (id: string, title: string) => {
    const newLanes = lanes.map((lane) => {
      if (lane.id === id) {
        return {
          ...lane,
          title,
        };
      }
      return lane;
    });
    setLanes(newLanes);
  };

  const editCard = (laneId: string, cardId: string, title: string, info: string) => {
    const lane = lanes.find((lane) => lane.id === laneId);
    if (!lane) return;
    const newCards = lane.cards.map((card) => {
      if (card.id === cardId) {
        return {
          ...card,
          title,
          info,
        };
      }
      return card;
    });
    const newLane = {
      ...lane,
      cards: newCards,
    };
    const newLanes = lanes.map((lane) => {
      if (lane.id === newLane.id) return newLane;
      return lane;
    });
    setLanes(newLanes);
  };

  useEffect(() => {
    const data = localStorage.getItem('data');
    if (!data) return;
    const parsedData = JSON.parse(data);
    if (!isValidData(parsedData)) return;
    setLanes(parsedData);
  }, []);

  useEffect(() => {
    // debounce it please
    // save to local storage
    const timerID = setTimeout(() => {
      localStorage.setItem('data', JSON.stringify(lanes));
    }, 5000);
    return () => {
      clearTimeout(timerID);
    }
  }, [lanes]);

  return (
    <div className="app">
      <div className="actions">
        <div className="btn" onClick={addLane}>Add Lane</div>
        <div className="btn" onClick={addCard}>Add Card</div>
        <div className="btn" onClick={importJSON}>Import</div>
        <div className="btn" onClick={exportJSON}>Export</div>
      </div>
      <div className="lanes">
        <DragDropContext onDragEnd={handleDrag} >
          {lanes.map((lane) => (
            <Droppable droppableId={lane.id} key={lane.id}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="lane">
                  <input type="text" value={lane.title} className="text-input" onChange={(e) => {
                    editLaneTitle(lane.id, e.target.value);
                  }} />
                  <div className="btn btn-warn" onClick={() => deleteLane(lane.id)}>Delete</div>
                  {lane.cards.map((card, index) => (
                    <Draggable draggableId={card.id} key={card.id} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="card">
                          <input type="text" value={card.title} className="text-input" onChange={(e) => {
                            editCard(lane.id, card.id, e.target.value, card.info);
                          }} />
                          <textarea value={card.info} className="text-input" onChange={(e) => {
                            editCard(lane.id, card.id, card.title, e.target.value);
                          }} />
                          <div className="btn btn-warn" onClick={() => deleteCard(lane.id, card.id)}>Delete</div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </DragDropContext>
      </div>
    </div>
  );
}

export default App;
