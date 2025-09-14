import { Button } from "@/components/ui/button";
import { Label } from "@radix-ui/react-label";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Fragment } from "react";
import z from "zod";

const DefaultSingleFieldSchema = z.object({
  value: z.string().min(1).max(32),
});

export function SingleFieldForm(props: {
  label: string;
  description: string;
  defaultValue: string;
  footerMessage?: string;
  schema?: z.ZodSchema<{ value: string }>;
  renderInput: (props: {
    onChange: (value: string) => void;
    value: string;
  }) => React.ReactNode;
  onSubmit: (value: string) => void | Promise<void>;
}) {
  const schema = props.schema || DefaultSingleFieldSchema;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm({
    defaultValues: {
      value: props.defaultValue,
    },
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const onSubmit = async (data: { value: string }) => {
    await props.onSubmit(data.value);
  };

  return (
    <form
      className="flex flex-col border rounded-lg overflow-hidden bg-card"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Controller
        name="value"
        control={control}
        render={({ field, fieldState }) => (
          <Fragment>
            <div className="flex flex-col gap-4 p-4">
              <Label htmlFor="field-input" className="text-lg font-semibold">
                {props.label}
              </Label>
              <p className="text-sm text-muted-foreground">
                {props.description}
              </p>
              {props.renderInput({
                value: field.value,
                onChange: field.onChange,
              })}
            </div>
            <div className="bg-sidebar p-4 flex justify-between items-center border-t">
              {fieldState.error ? (
                <p className="text-sm text-destructive">
                  {fieldState.error.message}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {props.footerMessage}
                </p>
              )}
              <Button
                size="sm"
                type="submit"
                disabled={isSubmitting || !isValid || !isDirty}
              >
                <span>Save</span>
              </Button>
            </div>
          </Fragment>
        )}
      />
    </form>
  );
}
