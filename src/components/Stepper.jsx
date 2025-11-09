export default function Stepper({ steps, currentStep, unlockedSteps, onStepClick }) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isActive = currentStep === stepNumber
          const isUnlocked = unlockedSteps.has(stepNumber)
          const isCompleted = currentStep > stepNumber

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <button
                  onClick={() => isUnlocked && onStepClick(stepNumber)}
                  disabled={!isUnlocked}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all
                    ${isActive ? 'bg-blue-600 text-white ring-4 ring-blue-200' : ''}
                    ${isCompleted ? 'bg-green-500 text-white' : ''}
                    ${!isActive && !isCompleted && isUnlocked ? 'bg-gray-300 text-gray-600 hover:bg-gray-400' : ''}
                    ${!isUnlocked ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </button>

                {/* Step Label */}
                <div className={`
                  mt-2 text-sm font-medium text-center
                  ${isActive ? 'text-blue-600' : ''}
                  ${isCompleted ? 'text-green-600' : ''}
                  ${!isActive && !isCompleted ? 'text-gray-500' : ''}
                `}>
                  {step.label}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={`
                  h-0.5 flex-1 mx-2 -mt-8 transition-all
                  ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}
                `} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
