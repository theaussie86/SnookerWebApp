$(function () {
    moment.locale('de');
    var userId= $('#user').attr('customid');
    var billId= $('#bill').attr('customid');
    $.ajax({
        type:'GET',
        data:{
            userId:userId,
            billId:billId
        },
        url:'/data/bill/print',
        success: function(data){
            console.log(data);
            printbill(data.user,data.rents);
        }
    });
});