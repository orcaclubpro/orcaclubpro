"use client"

import { useState, useRef } from "react"
import { ArrowRight, Zap, Code, Target, Brain, CheckCircle2, Play, Pause } from 'lucide-react'

interface WorkflowStep {
  id: number
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  code: string
  status: 'completed' | 'active' | 'pending'
}

const workflowSteps: WorkflowStep[] = [
  {
    id: 1,
    title: "Data Input",
    description: "Form submission received",
    icon: Code,
    code: "{ name: 'John Doe', email: 'john@company.com' }",
    status: 'pending'
  },
  {
    id: 2,
    title: "AI Processing",
    description: "Intelligent data enrichment",
    icon: Brain,
    code: "ai.enrich({ company: 'TechCorp', role: 'CEO' })",
    status: 'pending'
  },
  {
    id: 3,
    title: "Scoring",
    description: "Lead quality assessment",
    icon: Target,
    code: "score: 95/100 → priority: 'high'",
    status: 'pending'
  },
  {
    id: 4,
    title: "Automation",
    description: "Action triggered",
    icon: Zap,
    code: "sendEmail('welcome_sequence')",
    status: 'pending'
  }
]

export default function WorkflowCanvas() {
  const [steps, setSteps] = useState<WorkflowStep[]>(workflowSteps)
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  const scrollToStep = (stepIndex: number) => {
    const stepElement = stepRefs.current[stepIndex]
    if (stepElement) {
      stepElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      })
    }
  }

  const runWorkflow = async () => {
    if (isRunning) return
    
    setIsRunning(true)
    setCurrentStep(0)
    
    // Reset all steps
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const })))
    
    // Run through each step
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i)
      
      // Set current step to active
      setSteps(prev => prev.map((step, index) => ({
        ...step,
        status: index === i ? 'active' as const : 
                index < i ? 'completed' as const : 'pending' as const
      })))

      // Scroll to the active step
      scrollToStep(i)
      
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
    
    // Mark all as completed
    setSteps(prev => prev.map(step => ({ ...step, status: 'completed' as const })))
    
    // Reset after a pause
    setTimeout(() => {
      setIsRunning(false)
      setCurrentStep(0)
      setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const })))
    }, 2000)
  }

  const getStepStyles = (status: string) => {
    switch (status) {
      case 'active':
        return 'border-cyan-400/50 bg-cyan-400/5 scale-[1.02] shadow-lg shadow-cyan-400/20'
      case 'completed':
        return 'border-green-400/50 bg-green-400/5'
      case 'pending':
      default:
        return 'border-gray-600/30 bg-gray-800/20'
    }
  }

  const getIconStyles = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-cyan-400 bg-cyan-400/10'
      case 'completed':
        return 'text-green-400 bg-green-400/10'
      case 'pending':
      default:
        return 'text-gray-400 bg-gray-700/30'
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-light text-white mb-1">
            Workflow Automation
          </h3>
          <p className="text-sm text-gray-400">
            Watch intelligent processing in action
          </p>
        </div>
        <button
          onClick={runWorkflow}
          disabled={isRunning}
          className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 border border-cyan-400/30 rounded-lg hover:border-cyan-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <Pause className="w-4 h-4 text-cyan-400" />
          ) : (
            <Play className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
          )}
          <span className="text-sm text-cyan-400">
            {isRunning ? 'Running' : 'Demo'}
          </span>
        </button>
      </div>

      {/* Workflow Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isLast = index === steps.length - 1
          
          return (
            <div 
              key={step.id} 
              className="relative"
              ref={(el) => {
                stepRefs.current[index] = el
              }}
            >
              {/* Connector Line */}
              {!isLast && (
                <div className={`absolute left-6 top-12 w-0.5 h-8 transition-all duration-500 ${
                  step.status === 'completed' 
                    ? 'bg-gradient-to-b from-cyan-400/60 to-green-400/60' 
                    : 'bg-gradient-to-b from-gray-600/50 to-transparent'
                }`} />
              )}
              
              {/* Step Card */}
              <div className={`
                relative p-4 rounded-xl border transition-all duration-700 backdrop-blur-sm transform
                ${getStepStyles(step.status)}
                ${step.status === 'active' ? 'ring-2 ring-cyan-400/30 ring-offset-2 ring-offset-black' : ''}
              `}>
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`
                    relative p-2 rounded-lg transition-all duration-500
                    ${getIconStyles(step.status)}
                    ${step.status === 'active' ? 'scale-110' : ''}
                  `}>
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                    
                    {step.status === 'active' && (
                      <>
                        <div className="absolute inset-0 rounded-lg bg-cyan-400/20 animate-pulse" />
                        <div className="absolute -inset-1 rounded-lg bg-cyan-400/10 animate-ping" />
                      </>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-sm font-medium transition-colors duration-300 ${
                        step.status === 'active' ? 'text-cyan-400' : 'text-white'
                      }`}>
                        {step.title}
                      </h4>
                      {step.status === 'active' && (
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" />
                          <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                          <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-400 mb-3">
                      {step.description}
                    </p>

                    {/* Code Preview */}
                    <div className="bg-black/30 rounded-lg p-3 border border-gray-700/50">
                      <code className={`text-xs font-mono transition-all duration-500 ${
                        step.status === 'active' ? 'text-cyan-300 animate-pulse' :
                        step.status === 'completed' ? 'text-green-300' : 'text-gray-500'
                      }`}>
                        {step.code}
                      </code>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center">
                    {step.status === 'completed' && (
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    )}
                    {step.status === 'active' && (
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                    )}
                    {step.status === 'completed' && !isLast && (
                      <ArrowRight className="w-4 h-4 text-green-400 opacity-60 ml-2" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Enhanced Progress Footer */}
      {isRunning && (
        <div className="mt-6 p-4 bg-black/30 rounded-xl border border-cyan-400/30 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-cyan-400 font-medium">
              Processing step {currentStep + 1}...
            </span>
            <span className="text-sm text-gray-400">{currentStep + 1}/{steps.length}</span>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-1000 relative"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500 mb-3">
          This is just a simple example. We build custom workflows for your specific needs.
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-cyan-400/30 rounded-full" />
            Real-time processing
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400/30 rounded-full" />
            Intelligent automation
          </span>
        </div>
      </div>
    </div>
  )
} 