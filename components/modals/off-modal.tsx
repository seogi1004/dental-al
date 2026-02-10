"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { useModal } from "@/components/providers/modal-provider"
import { offModalSchema, OffModalFormValues } from "@/lib/schemas"
import { addLeave, updateLeave, deleteLeave, addOff, updateOff, deleteOff } from "@/services"

export function OffModal() {
  const { isOpen, config, closeModal } = useModal()
  const { mode, defaultTab, initialData, staffData, onSuccess, meta } = config

  const defaultCategory = (defaultTab || "leave") as "leave" | "off"

  const form = useForm<OffModalFormValues>({
    resolver: zodResolver(offModalSchema),
    defaultValues: {
      category: defaultCategory,
      leaveType: "종일",
      ...initialData,
    },
  })

  useEffect(() => {
    if (isOpen) {
      form.reset({
        category: defaultCategory,
        leaveType: "종일",
        memo: "",
        ...initialData,
      })
    }
  }, [isOpen, defaultTab, initialData, form, defaultCategory])

  const onSubmit = async (values: OffModalFormValues) => {
    try {
      const dateStr = format(values.date, "yyyy-MM-dd")
      
      if (values.category === "leave") {
        let finalDate = dateStr
        if (values.leaveType === "오전") finalDate += " AM"
        if (values.leaveType === "오후") finalDate += " PM"

        if (mode === "add") {
          await addLeave(values.staffName, finalDate)
          toast.success("연차가 등록되었습니다.")
        } else {
          const oldDate = meta?.originalDate
          const oldName = meta?.originalName
          if (!oldDate || !oldName) throw new Error("수정할 원본 정보를 찾을 수 없습니다.")
          
          await updateLeave(oldName, oldDate, finalDate)
          toast.success("연차가 수정되었습니다.")
        }
      } else if (values.category === "off") {
        const dateToSend = dateStr

        if (mode === "add") {
          await addOff(values.staffName, dateToSend, values.memo)
          toast.success("오프가 등록되었습니다.")
        } else {
          const oldDate = meta?.originalDate
          const oldName = meta?.originalName
          if (!oldDate || !oldName) throw new Error("수정할 원본 정보를 찾을 수 없습니다.")
          
          await updateOff(oldName, oldDate, dateToSend, values.memo)
          toast.success("오프가 수정되었습니다.")
        }
      }

      onSuccess?.()
      closeModal()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "작업 중 오류가 발생했습니다.")
    }
  }

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return

    try {
      const oldDate = meta?.originalDate
      const oldName = meta?.originalName
      if (!oldDate || !oldName) return

      const category = form.getValues("category")

      if (category === "leave") {
        await deleteLeave(oldName, oldDate)
        toast.success("연차가 삭제되었습니다.")
      } else if (category === "off") {
        await deleteOff(oldName, oldDate)
        toast.success("오프가 삭제되었습니다.")
      }
      onSuccess?.()
      closeModal()
    } catch (error: any) {
      toast.error(error.message || "삭제 실패")
    }
  }

  const category = form.watch("category")

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "일정 추가" : "일정 수정"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs 
              defaultValue={defaultTab} 
              value={category} 
              onValueChange={(val) => {
                  const newCategory = val as "leave" | "off"
                  form.setValue("category", newCategory)
              }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="leave">연차</TabsTrigger>
                <TabsTrigger value="off">오프</TabsTrigger>
                <TabsTrigger value="meal" disabled>식대(준비중)</TabsTrigger>
              </TabsList>

              <div className="mt-4 space-y-4">
                <FormField
                  control={form.control}
                  name="staffName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>직원</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="직원 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {staffData?.map((staff) => (
                            <SelectItem key={staff.name} value={staff.name}>
                              {staff.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>날짜</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: ko })
                              ) : (
                                <span>날짜 선택</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <TabsContent value="leave" className="space-y-4 mt-0">
                  <FormField
                    control={form.control}
                    name="leaveType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>연차 타입</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="종일" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                종일
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="오전" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                오전 반차
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="오후" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                오후 반차
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="memo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>비고 (현재 저장되지 않음)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="비고 입력" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="off" className="space-y-4 mt-0">
                  <FormField
                    control={form.control}
                    name="memo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>오프 사유/메모</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="오프 사유를 입력하세요"
                            className="resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="gap-2 sm:gap-0">
              {mode === "edit" && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDelete}
                  className="mr-auto"
                >
                  삭제
                </Button>
              )}
              <div className="flex gap-2 justify-end w-full sm:w-auto">
                <Button type="button" variant="outline" onClick={closeModal}>
                  취소
                </Button>
                <Button type="submit">저장</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
