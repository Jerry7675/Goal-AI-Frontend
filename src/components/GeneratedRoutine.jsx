import React from 'react'

const GeneratedRoutine = ({ routineState, approvedState }) => {
    const [routine, setRoutine] = routineState;
    const [approved, setApproved] = approvedState;


  const sendApproval = (status) => {
    setApproved(status);
    const payload = {
      type: "approval",
      data: { goal, approved: status },
    };
    socketRef.current.send(JSON.stringify(payload));
  };

  const handleNotifyChange = (idx, checked) => {
    setRoutine(prev =>
      prev.map((item, i) =>
        i === idx ? { ...item, notify: checked } : item
      )
    );
  };

  return (
    <div>
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-700">Generated Routine:</h2>
            <div className="bg-gray-100 p-4 rounded-lg text-sm">
              <div className="flex font-semibold text-gray-600 mb-2 px-1">
                <div className="flex-1 flex flex-row items-center">
                  <span className="w-24 mr-2">Time</span>
                  <span className="flex-1 mr-2">Message</span>
                </div>
                <div className="w-16 flex items-center justify-end">Notify</div>
              </div>
              <ul className="space-y-2">
                {Array.isArray(routine) ? (
                  routine.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center"
                    >
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center">
                        <span className="w-24 font-semibold text-blue-700 mr-2">{item.time}</span>
                        <span className="flex-1 text-gray-800 mr-2">{item.message}</span>
                      </div>
                      <div className="w-16 flex items-center justify-center mt-2 sm:mt-0 sm:ml-auto">
                        <input
                          type="checkbox"
                          checked={item.notify}
                          onChange={e => handleNotifyChange(idx, e.target.checked)}
                          className=""
                        />
                      </div>
                    </li>
                  ))
                ) : (
                  <pre className="whitespace-pre-wrap">{routine}</pre>
                )}
              </ul>
            </div>

            {approved === null && (
              <div className="mt-4 flex gap-4">
                <button
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg"
                  onClick={() => sendApproval(true)}
                >
                  Approve Email Reminders
                </button>
                <button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
                  onClick={() => sendApproval(false)}
                >
                  Reject Reminders
                </button>
              </div>
            )}

            {approved !== null && (
              <p className="mt-4 text-gray-600">
                You have {approved ? "approved" : "rejected"} email reminders.
              </p>
            )}
          </div>
        </div>
  )
}

export default GeneratedRoutine