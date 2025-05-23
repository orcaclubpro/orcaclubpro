import * as React from "react";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className || ""}`}
      {...props}
    />
  )
);
Card.displayName = "Card";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col space-y-1.5 p-6 ${className || ""}`}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={`text-2xl font-semibold leading-none tracking-tight ${className || ""}`}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={`text-sm text-muted-foreground ${className || ""}`}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`p-6 pt-0 ${className || ""}`}
      {...props}
    />
  )
);
CardContent.displayName = "CardContent";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex items-center p-6 pt-0 ${className || ""}`}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }; 